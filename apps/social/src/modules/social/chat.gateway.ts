import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ActiveSessionService } from '../auth/active-session.service';
import { SocialConfigService } from '../config/social-config.service';
import { SocialService } from './social.service';
import { SendMessageDto } from './social.dto';
import type { AuthPrincipal } from '../auth/auth-principal';

@WebSocketGateway({
  path: '/social/socket.io/',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly sessionCheckTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly activeSessions: ActiveSessionService,
    private readonly config: SocialConfigService,
    private readonly social: SocialService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractSocketToken(client);
      const principal = await this.activeSessions.verifyActivePrincipal(token);
      client.data.token = token;
      client.data.principal = principal;
      client.data.userId = principal.claims.sub;
      await client.join(`user:${principal.claims.sub}`);
      await this.social.markSocketOnline(principal.claims.sub, client.id);
      this.scheduleActiveSessionCheck(client);
      client.emit('presence.updated', {
        userId: principal.claims.sub,
        status: 'ONLINE',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      client.emit('error', { code: 'unauthorized', message });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    this.clearActiveSessionCheck(client.id);
    const userId = client.data?.userId as string | undefined;
    if (!userId) {
      return;
    }
    const wentOffline = await this.social.markSocketDisconnected(
      userId,
      client.id,
    );
    if (wentOffline) {
      this.server.emit('presence.updated', { userId, status: 'OFFLINE' });
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('clan.join')
  async joinClan(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { clanId?: string },
  ) {
    const principal = await this.activeSocketPrincipal(client);
    if (!payload?.clanId) {
      return { ok: false, error: 'clanId is required' };
    }
    await this.social.getClanMembership(
      payload.clanId,
      principal.claims.sub,
      principal,
    );
    await client.join(`clan:${payload.clanId}`);
    return { ok: true };
  }

  @SubscribeMessage('thread.join')
  async joinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId?: string },
  ) {
    const principal = await this.activeSocketPrincipal(client);
    if (!payload?.threadId) {
      return { ok: false, error: 'threadId is required' };
    }
    await this.social.getThread(payload.threadId, principal);
    await client.join(`thread:${payload.threadId}`);
    return { ok: true };
  }

  @SubscribeMessage('clan.message')
  async clanMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { clanId?: string; content?: string; clientMessageId?: string },
  ) {
    const principal = await this.activeSocketPrincipal(client);
    if (!payload?.clanId || !payload.content) {
      return { ok: false, error: 'clanId and content are required' };
    }
    const message = await this.social.sendClanMessage(
      payload.clanId,
      {
        content: payload.content,
        clientMessageId: payload.clientMessageId,
      } satisfies SendMessageDto,
      principal,
    );
    this.server.to(`clan:${payload.clanId}`).emit('message.created', message);
    return { ok: true, message };
  }

  @SubscribeMessage('thread.message')
  async threadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { threadId?: string; content?: string; clientMessageId?: string },
  ) {
    const principal = await this.activeSocketPrincipal(client);
    if (!payload?.threadId || !payload.content) {
      return { ok: false, error: 'threadId and content are required' };
    }
    const message = await this.social.sendMessage(
      payload.threadId,
      {
        content: payload.content,
        clientMessageId: payload.clientMessageId,
      } satisfies SendMessageDto,
      principal,
    );
    this.server
      .to(`thread:${payload.threadId}`)
      .emit('message.created', message);
    return { ok: true, message };
  }

  @SubscribeMessage('typing.start')
  async typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId?: string },
  ) {
    const principal = await this.activeSocketPrincipal(client);
    if (!payload?.threadId) {
      return { ok: false, error: 'threadId is required' };
    }
    await this.social.getThread(payload.threadId, principal);
    client.to(`thread:${payload.threadId}`).emit('typing.updated', {
      threadId: payload.threadId,
      userId: principal.claims.sub,
      typing: true,
    });
    return { ok: true };
  }

  private async activeSocketPrincipal(client: Socket): Promise<AuthPrincipal> {
    const token = client.data?.token as string | undefined;
    if (!token) {
      this.disconnectInactiveSocket(client, 'Missing bearer token');
      throw new Error('Unauthorized socket');
    }

    try {
      const principal = await this.activeSessions.verifyActivePrincipal(token);
      client.data.principal = principal;
      client.data.userId = principal.claims.sub;
      return principal;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unauthorized socket';
      this.disconnectInactiveSocket(client, message);
      throw error;
    }
  }

  private scheduleActiveSessionCheck(client: Socket): void {
    const intervalMs =
      this.config.websocket.sessionCheckIntervalSeconds * 1_000;
    const timer = setInterval(() => {
      void this.activeSocketPrincipal(client).catch(() => undefined);
    }, intervalMs);
    timer.unref?.();
    this.sessionCheckTimers.set(client.id, timer);
  }

  private clearActiveSessionCheck(clientId: string): void {
    const timer = this.sessionCheckTimers.get(clientId);
    if (!timer) {
      return;
    }
    clearInterval(timer);
    this.sessionCheckTimers.delete(clientId);
  }

  private disconnectInactiveSocket(client: Socket, message: string): void {
    client.emit('error', { code: 'session_inactive', message });
    client.disconnect(true);
  }

  private extractSocketToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake.headers.authorization;
    if (
      typeof header === 'string' &&
      header.toLowerCase().startsWith('bearer ')
    ) {
      return header.slice('bearer '.length);
    }

    throw new Error('Missing bearer token');
  }
}

import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LobbyManager } from 'src/lobbies/LobbyManager';

/**
 * Catch attempted socket.io connections forwarded from nginx
 */
@WebSocketGateway({
  path: '/socket.io/',
  cors: { origin: '*' },
})
export class EventSocket
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly lobbyManager: LobbyManager) {}
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventSocket');

  // Listens to a specific "event" (msgToServer) on the websocket
  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: string): void {
    // Log Event
    this.logger.log(`Message received: ${payload}`);
    // Handle Event
    this.lobbyManager.msgToServer(payload);
  }

  afterInit() {
    this.logger.log('Websocket Backend initiated');
    this.lobbyManager.on('dataToEmit', (payload: string) => {
      this.server.emit('msgToClient', payload);
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}

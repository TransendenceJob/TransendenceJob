import {
  BadGatewayException,
  HttpException,
  Injectable,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { BffConfigService } from '../config/bff-config.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileService } from './updateProfile.service';

type RequestContext = {
  requestId?: string;
  authorization?: string;
};

type UploadedMemoryFile = {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class SocialService {
  constructor(
    private readonly config: BffConfigService,
    private readonly authService: AuthService,
    private readonly updateProfileService: UpdateProfileService,
  ) {}

  async currentUserId(context: RequestContext): Promise<string> {
    //console.log("[BFF/social.service] currentUserId called", {
    //  authorization: context.authorization ? context.authorization.substring(0, 30) : "MISSING",
    //});
    this.ensureAuthorization(context.authorization);
    const verified = await this.authService.verify(context);
    //console.log("[BFF/social.service] verified user", { userId: verified.user.id });
    return verified.user.id;
  }

  // updated /internal/users => /users
  getMyProfile(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/users/${encodeURIComponent(userId)}/profile`,
        context,
      }),
    );
  }

  // updated path: /internal/users => /users
  updateMyProfile(input: unknown, context: RequestContext) {
    return this.updateProfileService.updateMyProfile(input, context);
  }

  // Forward metadata and avatar as multipart form data to the social service.
  saveMyProfile(input: unknown, file: UploadedMemoryFile | undefined, context: RequestContext) {
    return this.updateProfileService.saveMyProfile(input, file, context);
  }

  // updated path /internal/users => /users
  getUserProfile(userId: string, context: RequestContext) {
    return this.callSocialService({
      method: 'GET',
      path: `/internal/users/${encodeURIComponent(userId)}/profile`,
      context,
    });
  }

  searchUsers(query: Record<string, unknown>, context: RequestContext) {
    return this.callSocialService({
      method: 'GET',
      path: '/internal/users/search',
      params: query,
      context,
    });
  }

  getMyPrivacy(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/users/${encodeURIComponent(userId)}/privacy`,
        context,
      }),
    );
  }

  updateMyPrivacy(input: unknown, context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'PATCH',
        path: `/internal/users/${encodeURIComponent(userId)}/privacy`,
        data: input,
        context,
      }),
    );
  }

  uploadMyAvatar(file: UploadedMemoryFile, context: RequestContext) {
    return this.updateProfileService.uploadMyAvatar(file, context);
  }

  deleteMyAvatar(context: RequestContext) {
    return this.updateProfileService.deleteMyAvatar(context);
  }

  async getAvatar(fileName: string, context: RequestContext) {
    return this.updateProfileService.getAvatar(fileName, context);
  }

  listFriends(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/friends/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listIncomingFriendRequests(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/friend-requests/incoming/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listOutgoingFriendRequests(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/friend-requests/outgoing/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  removeFriend(otherUserId: string, context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'DELETE',
        path: `/internal/friends/${encodeURIComponent(userId)}/${encodeURIComponent(otherUserId)}`,
        context,
      }),
    );
  }

  listBlocks(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/blocks/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  removeBlock(blockedUserId: string, context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'DELETE',
        path: `/internal/blocks/${encodeURIComponent(userId)}/${encodeURIComponent(blockedUserId)}`,
        context,
      }),
    );
  }

  listMyClans(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/clans/by-user/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listMyClanInvites(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/clan-invites/by-user/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listChats(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/chats/by-user/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  proxy(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    context: RequestContext,
    data?: unknown,
    params?: Record<string, unknown>,
  ) {
    return this.callSocialService({ method, path, context, data, params });
  }

  private async withMe<T>(
    context: RequestContext,
    fn: (userId: string) => Promise<T>,
  ): Promise<T> {
    const userId = await this.currentUserId(context);
    return fn(userId);
  }

  private ensureAuthorization(authorization?: string): void {
    //console.log("[BFF/social.service] ensureAuthorization check", {
    //  hasAuthorization: Boolean(authorization),
    //  authorizationStart: authorization ? authorization.substring(0, 30) : "MISSING",
    //  startsWithBearer: authorization?.toLowerCase().startsWith('bearer '),
    //});
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException({
        code: 'missing_bearer_token',
        message: 'Authorization header with Bearer token is required.',
      });
    }
  }

  private async callSocialService<T>(input: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    context: RequestContext;
    data?: unknown;
    params?: Record<string, unknown>;
    extraHeaders?: Record<string, string>;
  }): Promise<T> {
    const response = await this.callSocialRaw<T>(input);
    return response.data;
  }

  private async callSocialRaw<T = any>(input: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    context: RequestContext;
    data?: unknown;
    params?: Record<string, unknown>;
    responseType?: 'json' | 'stream';
    extraHeaders?: Record<string, string>;
  }) {
    const headers: Record<string, string> = {
      'x-service-name': 'bff',
      ...(input.extraHeaders ?? {}),
    };

    if (input.context.requestId) {
      headers['x-request-id'] = input.context.requestId;
    }

    if (input.context.authorization) {
      headers.authorization = input.context.authorization;
    }

    try {
      return await axios.request<T>({
        method: input.method,
        url: `${this.config.social.serviceUrl}${input.path}`,
        headers,
        data: input.data,
        params: input.params,
        responseType: input.responseType,
      });
    } catch (error) {
      this.throwNormalizedError(error);
    }
  }

  // edit the error message
  private throwNormalizedError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data: unknown = axiosError.response?.data;
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message?: unknown }).message)
          : axiosError.message;

      throw new HttpException(
        {
          code: `social_service_${status ?? 'error'}`,
          message,
          details: data,
        },
        status ?? 502,
      );
    }

    throw new BadGatewayException({
      code: 'social_service_unreachable',
      message: 'Unable to reach social service.',
      details: error,
    });
  }
}

import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SocialConfigService } from '../config/social-config.service';

export type AuthDirectoryUser = {
  id: string;
  email: string;
  username?: string | null;
  status?: string;
};

type AuthDirectorySearchResponse = {
  items?: AuthDirectoryUser[];
  pageInfo?: {
    nextCursor?: string | null;
    hasNextPage?: boolean;
  };
};

type AuthDirectorySearchInput = {
  query?: string;
  cursor?: string;
  limit?: number;
};

@Injectable()
export class AuthDirectoryService {
  constructor(private readonly config: SocialConfigService) {}

  async searchUsers(
    input: AuthDirectorySearchInput,
    token: string,
  ): Promise<AuthDirectorySearchResponse> {
    const url = new URL(
      '/internal/auth/users/search',
      this.config.auth.serviceUrl,
    );

    if (input.query) {
      url.searchParams.set('query', input.query);
    }
    if (input.cursor) {
      url.searchParams.set('cursor', input.cursor);
    }
    if (input.limit) {
      url.searchParams.set('limit', String(input.limit));
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'x-service-name': this.config.app.serviceName,
      },
    }).catch(() => {
      throw new ServiceUnavailableException('Unable to reach auth directory');
    });

    if (response.status === 401) {
      throw new UnauthorizedException('Auth directory rejected the token');
    }
    if (response.status === 403) {
      throw new ForbiddenException('Auth directory denied the lookup');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException('Auth directory lookup failed');
    }

    return (await response.json()) as AuthDirectorySearchResponse;
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class SocialRedisKeyService {
  private readonly prefix = 'social';

  build(namespace: string, identifier: string): string {
    return `${this.prefix}:${namespace}:${identifier}`;
  }

  presence(userId: string): string {
    return this.build('presence', userId);
  }

  connection(userId: string, socketId: string): string {
    return this.build('connection', `${userId}:${socketId}`);
  }

  connections(userId: string): string {
    return this.build('connections', userId);
  }
}

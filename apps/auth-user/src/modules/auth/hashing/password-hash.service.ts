/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { AuthConfigService } from '../../config/auth-config.service';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordHashService {
  constructor(private readonly config: AuthConfigService) {}

  async hashPassword(password: string): Promise<string> {
    if (this.config.passwordHashing.algorithm === 'bcrypt') {
      return await bcrypt.hash(
        password,
        this.config.passwordHashing.bcryptRounds,
      );
    }

    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.config.passwordHashing.memoryCost,
      timeCost: this.config.passwordHashing.timeCost,
      parallelism: this.config.passwordHashing.parallelism,
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (this.config.passwordHashing.algorithm === 'bcrypt') {
      return await bcrypt.compare(password, hash);
    }

    return await argon2.verify(hash, password);
  }

  async hash(password: string): Promise<string> {
    return await this.hashPassword(password);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await this.verifyPassword(password, hash);
  }
}

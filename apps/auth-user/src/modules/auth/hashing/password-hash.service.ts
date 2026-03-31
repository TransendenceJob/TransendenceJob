/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { AuthConfigService } from '../../config/auth-config.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHashService {
  constructor(private readonly config: AuthConfigService) {}

  async hash(password: string): Promise<string> {
    if (this.config.passwordHashing.algorithm === 'bcrypt') {
      return await bcrypt.hash(
        password,
        this.config.passwordHashing.bcryptRounds,
      );
    }
    throw new Error('Argon2 path not implemented yet');
  }
  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}

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

  /**
   * Hashes a plaintext password using bcrypt or argon2.
   * Algorithm is determined by configuration.
   * @param password - The plaintext password to hash
   * @returns Promise resolving to the password hash
   * @example
   * const hash = await passwordHashService.hashPassword('secretPassword123');
   * // Store hash in database, never store plain password
   */
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

  /**
   * Verifies a plaintext password against a stored hash.
   * Uses bcrypt or argon2 depending on configuration.
   * @param password - The plaintext password to verify
   * @param hash - The stored password hash
   * @returns Promise resolving to true if password matches; false otherwise
   * @example
   * const isValid = await passwordHashService.verifyPassword(
   *   inputPassword,
   *   storedHash
   * );
   * if (!isValid) throw new UnauthorizedException();
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (this.config.passwordHashing.algorithm === 'bcrypt') {
      return await bcrypt.compare(password, hash);
    }

    return await argon2.verify(hash, password);
  }

  /**
   * Alias for hashPassword; provided for consistent naming conventions.
   * @param password - The plaintext password to hash
   * @returns Promise resolving to the password hash
   */
  async hash(password: string): Promise<string> {
    return await this.hashPassword(password);
  }

  /**
   * Alias for verifyPassword; provided for consistent naming conventions.
   * @param password - The plaintext password to verify
   * @param hash - The stored password hash
   * @returns Promise resolving to true if password matches; false otherwise
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return await this.verifyPassword(password, hash);
  }
}

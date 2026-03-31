import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRedisKeyService {
  private readonly prefix = 'auth';

  /**
   * Builds a canonical Redis key with auth namespace.
   * @param namespace - The key category (e.g., 'verify', 'revoked:access', 'ratelimit', 'session')
   * @param identifier - The key identifier (e.g., user ID, session ID, token hash)
   * @returns Formatted key: `auth:<namespace>:<identifier>`
   * @example
   * build('verify', 'email@example.com') // 'auth:verify:email@example.com'
   */
  build(namespace: string, identifier: string): string {
    return `${this.prefix}:${namespace}:${identifier}`;
  }

  /**
   * Builds a key for verification lookup cache entries.
   * Use for email verification, OTP verification, code validation, etc.
   * @param identifier - Unique verification identifier (e.g., 'email:user@example.com')
   * @returns Formatted key: `auth:verify:<identifier>`
   * @example
   * verifyLookup('email:user@example.com') // 'auth:verify:email:user@example.com'
   */
  verifyLookup(identifier: string): string {
    return this.build('verify', identifier);
  }

  /**
   * Builds a key for revoked access token entries.
   * Used to store revocation markers in a short-lived blacklist.
   * @param fingerprint - SHA256 hash of the access token
   * @returns Formatted key: `auth:revoked:access:<fingerprint>`
   * @example
   * revokedAccessToken(tokenHash) // 'auth:revoked:access:<hash>'
   */
  revokedAccessToken(fingerprint: string): string {
    return this.build('revoked:access', fingerprint);
  }

  /**
   * Builds a key for rate-limit counter buckets.
   * @param bucket - The rate-limit bucket (e.g., 'login:ip:127.0.0.1', 'otp:+1234567890')
   * @returns Formatted key: `auth:ratelimit:<bucket>`
   * @example
   * rateLimit('login:ip:192.168.1.1') // 'auth:ratelimit:login:ip:192.168.1.1'
   */
  rateLimit(bucket: string): string {
    return this.build('ratelimit', bucket);
  }

  /**
   * Builds a key for session cache entries.
   * @param sessionId - Unique session identifier (UUID or equivalent)
   * @returns Formatted key: `auth:session:<sessionId>`
   * @example
   * sessionById('550e8400-e29b-41d4-a716-446655440000')
   * // 'auth:session:550e8400-e29b-41d4-a716-446655440000'
   */
  sessionById(sessionId: string): string {
    return this.build('session', sessionId);
  }
}

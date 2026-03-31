# Redis Helper API Reference (auth-service)

This document explains the Redis helper methods in auth-service, what each one is for, and when to use it.

## Where this lives

- `RedisModule`: registers Redis helpers globally.
- `AuthRedisService`: operational Redis methods (cache, revocation, counters, sessions).
- `AuthRedisKeyService`: standardized key generation.

## Quick decision guide

- Need a key string with consistent namespace? → use `AuthRedisKeyService`.
- Need to cache a short-lived verification lookup? → `cacheVerifyLookup` / `getVerifyLookup`.
- Need access token revocation blacklist behavior? → `revokeAccessToken` / `isAccessTokenRevoked`.
- Need rate-limit counting with a fixed window? → `incrementRateLimitCounter`.
- Need short-lived session cache by session id? → `cacheSessionById` / `getSessionById` / `deleteSessionById`.
- Need to expose dependency readiness? → `isHealthy`.

## AuthRedisKeyService

### `build(namespace: string, identifier: string): string`
Creates the canonical Redis key format:

`auth:<namespace>:<identifier>`

**Use when**
- You need a custom namespaced key not already covered by helper methods.

**Example**
```ts
const key = authRedisKeyService.build('mfa', userId);
// auth:mfa:<userId>
```

### `verifyLookup(identifier: string): string`
Builds key for verification lookup cache.

**Use when**
- Caching or reading verification-related payloads (email verify, code verify, etc.).

**Example**
```ts
const key = authRedisKeyService.verifyLookup(`email:${email}`);
```

### `revokedAccessToken(fingerprint: string): string`
Builds key for revoked access token markers.

**Use when**
- Writing/checking blacklist flags for access tokens.

**Example**
```ts
const key = authRedisKeyService.revokedAccessToken(tokenHash);
```

### `rateLimit(bucket: string): string`
Builds key for rate-limit counters.

**Use when**
- You need a deterministic bucket like `login:ip:1.2.3.4`.

**Example**
```ts
const key = authRedisKeyService.rateLimit(`login:ip:${ip}`);
```

### `sessionById(sessionId: string): string`
Builds key for session cache entries.

**Use when**
- Caching a session payload tied to one session id.

**Example**
```ts
const key = authRedisKeyService.sessionById(sessionId);
```

## AuthRedisService

### Lifecycle / health

### `onModuleInit(): Promise<void>`
Connects to Redis during module init. Fails gracefully (service stays usable with fallbacks).

**Use when**
- Framework lifecycle only; do not call directly in feature code.

### `onModuleDestroy(): Promise<void>`
Closes Redis connection on shutdown.

**Use when**
- Framework lifecycle only; do not call directly in feature code.

### `isHealthy(): boolean`
Returns whether Redis is connected and ready.

**Use when**
- Health endpoints, readiness checks, or conditional Redis behavior.

**Example**
```ts
@Get('health')
getHealth() {
  return {
    redis: authRedisService.isHealthy() ? 'up' : 'down',
  };
}
```

---

### Verify lookup cache

### `cacheVerifyLookup(identifier: string, payload: string, ttlSeconds = 60): Promise<void>`
Writes a short-lived verification payload to Redis.

**Use when**
- You want to avoid repeated DB/API work for recent verify checks.

**Example**
```ts
await authRedisService.cacheVerifyLookup(
  `email:${email}`,
  JSON.stringify({ userId, verified: true }),
  90,
);
```

### `getVerifyLookup(identifier: string): Promise<string | null>`
Reads verification payload from Redis.

**Use when**
- You want fast-path cached verify data before fallback to DB.

**Example**
```ts
const cached = await authRedisService.getVerifyLookup(`email:${email}`);
if (cached) {
  return JSON.parse(cached);
}
```

---

### Access token revocation

### `revokeAccessToken(token: string, ttlSeconds: number): Promise<void>`
Stores a revoked marker for an access token fingerprint with TTL.

**Use when**
- Logout, forced sign-out, or security response needs early token invalidation.

**Example**
```ts
await authRedisService.revokeAccessToken(accessToken, 15 * 60);
```

### `isAccessTokenRevoked(token: string): Promise<boolean>`
Checks if access token fingerprint has a revoke marker.

**Use when**
- Middleware/guard validation path before accepting a JWT.

**Example**
```ts
const revoked = await authRedisService.isAccessTokenRevoked(accessToken);
if (revoked) throw new UnauthorizedException('Access token revoked');
```

---

### Rate limiting

### `incrementRateLimitCounter(bucket: string, windowSeconds: number): Promise<number>`
Increments a counter and sets expiry on first increment.

**Use when**
- Login attempt limits, OTP request limits, brute-force protection.

**Example**
```ts
const bucket = `login:ip:${ipAddress}`;
const count = await authRedisService.incrementRateLimitCounter(bucket, 60);
if (count > 10) throw new TooManyRequestsException('Too many attempts');
```

---

### Session cache

### `cacheSessionById(sessionId: string, payload: string, ttlSeconds: number): Promise<void>`
Stores session payload by session id.

**Use when**
- You have hot session reads and want to reduce DB pressure.

**Example**
```ts
await authRedisService.cacheSessionById(
  sessionId,
  JSON.stringify({ userId, roles, device }),
  300,
);
```

### `getSessionById(sessionId: string): Promise<string | null>`
Fetches cached session payload.

**Use when**
- Fast-path session lookup before DB read.

**Example**
```ts
const cached = await authRedisService.getSessionById(sessionId);
const session = cached ? JSON.parse(cached) : await loadSessionFromDb(sessionId);
```

### `deleteSessionById(sessionId: string): Promise<void>`
Deletes cached session key.

**Use when**
- Session revocation, logout, or cache invalidation after session update.

**Example**
```ts
await authRedisService.deleteSessionById(sessionId);
```

## Error handling behavior

`AuthRedisService` is intentionally fail-safe:

- If Redis is unavailable, methods return fallback-safe values where applicable.
- Write operations no-op instead of crashing auth flow.
- Health endpoint should report degraded status when Redis is down.

This means Redis improves performance and revocation/rate-limit responsiveness, while core auth can still remain available.

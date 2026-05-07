/** * --- Types ---
 */
export type UserStatus = string;
export type UserRole = string;

/** * --- Sub-Entities ---
 */
export interface UserAuthView {
    id: string;
    email: string;
    displayName: string | null;
    username: string | null;
    status: UserStatus;
    roles: UserRole[];
    createdAt?: string | null;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}

export interface SessionInfo {
    id: string;
    expiresAt: string;
    revoked?: boolean | null;
}

/** * --- Requests ---
 */

export interface RegisterRequest {
    email: string;
    password: string;
    displayName?: string;
    username?: string;
}

export interface LoginRequest {
    email: string;
    password:  string;
}

export interface LogoutRequest {
    refreshToken: string;
    logoutAll?: boolean;
}

export interface RefreshRequest {
    refreshToken: string;
}

export interface GoogleExchangeRequest {
    provider: 'google';
    authorizationCode?: string;
    idToken?: string;
    redirectUri?: string;
}

export interface SetPasswordRequest {
    password: string;
}

/** * --- Responses ---
 */

export interface AuthSuccessResponse {
    user: UserAuthView & { // & is intersection type for "merging"
        providers?: Array<{ provider: string; providerUserId: string }>;
    };
    tokens: TokenPair;
    session: SessionInfo;
}

export interface LogoutResponse {
    success: boolean;
    revokedSessionIds: string[];
}

export interface RefreshResponse {
    tokens: TokenPair;
    session: SessionInfo;
}

export interface VerifyResponse {
    valid: boolean;
    user: UserAuthView;
    session: SessionInfo;
    claims: {
        sub: string;
        iat: number;
        exp: number;
        iss: string;
        aud?: string | null;
    };
}

export interface AuthMeResponse {
    user: UserAuthView;
    session: SessionInfo;
    claims: {
        sub: string;
        iat: number;
        exp: number;
        iss: string;
        aud?: string | null;
    };
}

/** * --- Internal Client Types ---
 * Used for token refresh deduplication and request retries.
 */
export interface PendingRequest {
    resolve: (token: string | null) => void;
    reject: (error: any) => void;
}

export interface InternalRequestInit extends RequestInit {
    _retry?: boolean;
}

/**
 * --- Admin Management DTOs ---
 * These types correspond to the /admin endpoints in the BFF
 */

export interface PageInfoDto {
    nextCursor?: string | null;
    hasNextPage: boolean;
}

export interface UserSearchQueryDto {
    query?: string;
    cursor?: string;
    limit?: number;
}

export interface UserSearchResponseDto {
    items: UserAuthView[];
    pageInfo: PageInfoDto;
}

export interface DisableUserRequestDto {
    reason: string;
    revokeSessions?: boolean;
}

export interface EnableUserRequestDto {
    reason?: string;
}

export interface UpdatePlayerStatsDto {
    wins?: number;
    losses?: number;
    xp?: number;
    level?: number;
}

/** * --- Errors ---
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any> | null;
}

export interface SetPasswordResponse {
    success: boolean;
}

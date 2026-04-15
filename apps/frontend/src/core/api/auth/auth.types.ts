/** * --- Types ---
 */
export type UserStatus = 'active' | 'disabled' | 'pending';
export type UserRole = 'user' | 'moderator' | 'admin';

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

/** * --- Responses ---
 */

export interface AuthSuccessResponse {
    user: UserAuthView & { // & is intersection type for "merging"
        providers?: Array<{ name: string; providerUserId: string }>;
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

/** * --- Errors ---
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any> | null;
}
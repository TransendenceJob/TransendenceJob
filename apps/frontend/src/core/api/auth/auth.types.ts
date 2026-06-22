import { z } from "zod";

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

export interface PageInfo {
    nextCursor?: string | null;
    hasNextPage: boolean;
}

export interface UserSearchRequest {
    query?: string;
    cursor?: string;
    limit?: number;
}

export interface UserSearchResponse {
    items: UserAuthView[];
    pageInfo: PageInfo;
}

export interface UserDisabledRequest {
    reason: string;
    revokeSessions?: boolean;
}

export interface UserDisabledResponse {
    userId: string;
    status: string;
    revokedSessions: number;
}

export interface UserEnabledRequest {
    reason?: string;
}

export interface UserEnabledResponse {
    userId: string;
    status: string;
}

export interface SetUserRolesRequest {
    roles: string[];
}

export interface UserRolesResponse {
    userId: string;
    roles: string[];
    updatedAt: string;
}

export interface UpdatePlayerStatsRequest {
    matchesWon?: string[];
    matchesLost?: string[];
    achievements?: string[];
    weapons?: string[];
    matchParticipants?: string[];
    xp?: number;
    level?: number;
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
    damageDealt?: number;
    damageTaken?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpdatePlayerStatsResponse {
    matchesWon?: string[];
    matchesLost?: string[];
    achievements?: string[];
    weapons?: string[];
    matchParticipants?: string[];
    xp?: number;
    level?: number;
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
    damageDealt?: number;
    damageTaken?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface RevokeSessionsRequest {
    reason?: string;
}

export interface RevokeSessionsResponse {
    userId: string;
    revokedSessions: number;
}


/**
 * --- Admin UI Helper Types ---
 */
export type ConfirmAction =
    | { mode: 'stats'; payload: UpdatePlayerStatsRequest }
    | { mode: 'roles'; payload: string[] }
    | { mode: 'kick'; payload: string }
    | { mode: 'default'; payload: string };

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

export interface PlayerStatsData {
    level: number;
    xp: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
}
/**
 * --- stat hard limit ---
 */
export const MAX_STAT_LIMIT = 9999;
export const MIN_STAT_LIMIT = 0;

/**
 * --- zod validation for stats ---
 */
export const playerStatsValidationSchema = z.object({
    level: z.coerce.number()
        .int({ message: "Level must be a whole number" })
        .min(1, { message: "Level must be at least 1" })
        .max(MAX_STAT_LIMIT, { message: `Level cannot exceed ${MAX_STAT_LIMIT}` }),

    xp: z.coerce.number()
        .int()
        .min(MIN_STAT_LIMIT, { message: "XP cannot be negative" })
        .max(MAX_STAT_LIMIT, { message: `XP cannot exceed ${MAX_STAT_LIMIT}` }),

    wins: z.coerce.number()
        .int()
        .min(MIN_STAT_LIMIT, { message: "Wins cannot be negative" })
        .max(MAX_STAT_LIMIT, { message: `Wins cannot exceed ${MAX_STAT_LIMIT}` }),

    losses: z.coerce.number()
        .int()
        .min(MIN_STAT_LIMIT, { message: "Losses cannot be negative" })
        .max(MAX_STAT_LIMIT, { message: `Losses cannot exceed ${MAX_STAT_LIMIT}` }),

    kills: z.coerce.number()
        .int()
        .min(MIN_STAT_LIMIT, { message: "Kills cannot be negative" })
        .max(MAX_STAT_LIMIT, { message: `Kills cannot exceed ${MAX_STAT_LIMIT}` }),

    deaths: z.coerce.number()
        .int()
        .min(MIN_STAT_LIMIT, { message: "Deaths cannot be negative" })
        .max(MAX_STAT_LIMIT, { message: `Deaths cannot exceed ${MAX_STAT_LIMIT}` }),
});

export const adminActionSchema = z.object({
    reason: z
        .string()
        .trim()
        .max(255, { message: "Reason must be 255 characters or less" })
        .transform((val) => {
            return val.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        })
        .optional(),
});
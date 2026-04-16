import type
{
    AuthSuccessResponse,
    AuthMeResponse,
    LoginRequest,
    RegisterRequest,
    LogoutRequest,
    LogoutResponse,
    RefreshRequest,
    RefreshResponse,
    VerifyResponse,
    GoogleExchangeRequest,
    ApiError
} from "@/src/core/api/auth/auth.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type ApiResult<T> =
    | { ok: true; data: T; status: number }
    | { ok: false; error: ApiError | unknown; status: number };

async function handleApiResponse<T>(response: Response): Promise<ApiResult<T>> {
    const status = response.status;

    // If status is 204 (No Content), return empty object cast as T, relevant for logout, delete, update...
    if (status === 204){
        return { ok: true, data: {} as T, status };
    }

    // predefined message in case if the bff / server can't reply
    const fallbackError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
        details: null
    };

    const contentType = response.headers?.get?.('content-type') ?? '';
    const shouldParseJson =
        contentType.includes('application/json') ||
        typeof response.json === 'function';

    const data = shouldParseJson
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

    if (response.ok) {
        return { ok: true, data, status };
    }
    // other errors (401, 404, 500) Return the server's error data if available otherwise use fallback
    return { ok: false, error: data ?? fallbackError, status };
}

export const authClient = {

    // --- Registration & Login ---
    async register(data: RegisterRequest): Promise<ApiResult<AuthSuccessResponse>> {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return handleApiResponse<AuthSuccessResponse>(response);
    },

    async login(data: LoginRequest): Promise<ApiResult<AuthSuccessResponse>> {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleApiResponse<AuthSuccessResponse>(response);
    },

    // --- Session Management ---
    async logout(data: LogoutRequest, accessToken: string): Promise<ApiResult<LogoutResponse>> {
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleApiResponse<LogoutResponse>(response);
    },

    async refresh(data: RefreshRequest): Promise<ApiResult<RefreshResponse>> {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleApiResponse<RefreshResponse>(response);
    },

    // --- Identity & Verification ---
    /**
     * getMe: Fetches the current user profile directly from the BFF.
     */
    async getMe(accessToken: string): Promise<ApiResult<AuthMeResponse>> {
        const response = await fetch(`${BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
        });

        return handleApiResponse<AuthMeResponse>(response);
    },

    /**
     * verify: Returns the full token validation data (claims, session info)
     */
    async verify(accessToken: string): Promise<ApiResult<VerifyResponse>> {
        const response = await fetch(`${BASE_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
        });
        return handleApiResponse<VerifyResponse>(response);
    },

    // --- Social Auth ---
    startGoogleOAuth(): void {
        window.location.href = `${BASE_URL}/auth/google/start`;
    },

    async exchangeGoogleCallback(data: GoogleExchangeRequest): Promise<ApiResult<AuthSuccessResponse>> {
        const response = await fetch(`${BASE_URL}/auth/google/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleApiResponse<AuthSuccessResponse>(response);
    },

}
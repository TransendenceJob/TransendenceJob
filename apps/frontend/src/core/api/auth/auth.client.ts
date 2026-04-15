import type
{
    AuthSuccessResponse,
    LoginRequest,
    RegisterRequest,
    LogoutRequest,
    LogoutResponse,
    RefreshRequest,
    RefreshResponse,
    UserAuthView,
    VerifyResponse,
    GoogleExchangeRequest,
} from "@/src/core/api/auth/auth.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type ApiResult<T> =
    | { ok: true; data: T; status: number }
    | { ok: false; error: any; status: number };

async function handleApiResponse<T>(response: Response): Promise<ApiResult<T>> {
    const status = response.status;

    // If status is 204 (No Content), return empty object cast as T, relevant for logout, delete, update...
    if (status === 204){
        return { ok: true, data: {} as T, status };
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
        return { ok: true, data, status };
    }
    // other errors (401, 404, 500) Return as error object
    return { ok: false, error: data, status };
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
    async logout(data: LogoutRequest): Promise<ApiResult<LogoutResponse>> {
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
     * getMe: A convenience method that usually just returns the User object
     */
    async getMe(accessToken: string): Promise<UserAuthView | null> {
        const result = await this.verify(accessToken);
        return result.ok ? result.data.user : null;
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
        window.location.href = `${BASE_URL}/auth/google`;
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
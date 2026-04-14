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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function handleApiResponse<T>(response: Response): Promise<T> {
    // If status is 204 (No Content), return empty object cast as T, relevant for logout, delete, update...
    if (response.status === 204) return {} as T;

    // If the response is OK, return the JSON
    if (response.ok) {
        return response.json();
    }
    // other errors (401, 404, 500) bff will return an error object no need to create my own
    return response.json();
}

export const authClient = {

    // --- Registration & Login ---
    async register(data: RegisterRequest): Promise<AuthSuccessResponse> {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return handleApiResponse<AuthSuccessResponse>(response);
    },

    async login(data: LoginRequest): Promise<AuthSuccessResponse> {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleApiResponse<AuthSuccessResponse>(response);
    },

    // --- Session Management ---
    async logout(data: LogoutRequest): Promise<LogoutResponse> {
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleApiResponse<LogoutResponse>(response);
    },

    async refresh(data: RefreshRequest): Promise<RefreshResponse> {
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
    async getMe(accessToken: string): Promise<UserAuthView> {
        const data = await this.verify(accessToken);
        return data?.user;
    },

    /**
     * verify: Returns the full token validation data (claims, session info)
     */
    async verify(accessToken: string): Promise<VerifyResponse> {
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

    async exchangeGoogleCallback(data: GoogleExchangeRequest): Promise<AuthSuccessResponse> {
        const response = await fetch(`${BASE_URL}/auth/google/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleApiResponse<AuthSuccessResponse>(response);
    },

}
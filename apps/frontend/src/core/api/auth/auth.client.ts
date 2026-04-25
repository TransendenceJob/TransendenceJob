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
    PendingRequest,
    InternalRequestInit,
    ApiError
} from "@/src/core/api/auth/auth.types";


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type ApiResult<T> =
    | { ok: true; data: T; status: number }
    | { ok: false; error: ApiError; status: number };

let isRefreshing = false;
let failedQueue: PendingRequest[] = [];

//Processes all requests that failed while token was being refreshed.
const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

async function handleRefreshFailure<T>(originalResponse: Response) {
    processQueue(new Error("Refresh failed"), null);
    sessionStorage.removeItem("auth.accessToken");
    sessionStorage.removeItem("auth.refreshToken");

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event("auth-unauthorized"));
    }

    isRefreshing = false;
    return handleApiResponse<T>(originalResponse);
}

async function handleApiResponse<T>(response: Response): Promise<ApiResult<T>> {
    const status = response.status;

    // If status is 204 (No Content), return empty object cast as T, relevant for logout, delete, update...
    if (status === 204) {
        return {ok: true, data: {} as T, status};
    }

    if (response.status === 401) {
        // Dispatch a global event that the Providers can listen for
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event("auth-unauthorized"));
        }
    }

    const contentType = response.headers?.get?.('content-type') ?? '';
    const shouldParseJson =
        contentType.includes('application/json') ||
        typeof response.json === 'function';

    const data = shouldParseJson
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

    if (response.ok) {
        return {ok: true, data, status};
    }

    // Ensure safe object for spreading
    const safeData =
        typeof data === 'object' && data !== null ? data : {};

    // prioritize the bff message
    const message =
        safeData?.details?.error?.message ||
        safeData?.message ||
        'An unexpected error occurred.';

    // For errors (401, 404, 500, etc.), ormalize error response into a consistent ApiError shape
    // but overwrite the generic 'message' with the specific reason
    return {
        ok: false,
        status,
        error: {
            code: safeData.code || 'UNKNOWN_ERROR',
            ...safeData,
            message
        }
    };
}


/**
 * Helper for making API requests
 * - adds JSON headers
 * - adds auth token if available
 * - handles responses in one place
 * - prepares for handling 401 errors (login expired)
 */
async function apiFetch<T>(url: string, options: InternalRequestInit = {}): Promise<ApiResult<T>> {
    const token = sessionStorage.getItem("auth.accessToken");
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers, // Allows the caller to override or add headers
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
    };

    const response = await fetch(url, {...options, headers});

    if (response.status === 401 && !url.includes('/auth/refresh')) {

        // Prevent the same request to retry twice
        if (options._retry) {
            return handleApiResponse<T>(response);
        }
        // Scenario A : Currently refreshing
        if (isRefreshing) {
            return new Promise((resolve) => {
                failedQueue.push({
                    resolve: async (_) => {
                        options._retry = true;
                        resolve(await apiFetch<T>(url, options));
                    },
                    reject: (err) => {
                        resolve(handleApiResponse<T>(response));
                    },
                });
            });
        }

        // Scenario B: First request which gets code 401
        isRefreshing = true;
        options._retry = true;

        const refreshToken = sessionStorage.getItem("auth.refreshToken");
        // Scenario C: No credentials available to attempt recovery
        if (!refreshToken) {
            return handleRefreshFailure(response);
        }

        // Scenario D : Recovery attempt failed
        const refreshResult = await authClient.refresh({refreshToken});

        if (!refreshResult.ok) {
            return handleRefreshFailure(response);
        }

        // Success Path
        const {accessToken, refreshToken: newRefreshToken} = refreshResult.data.tokens;
        sessionStorage.setItem("auth.accessToken", accessToken);
        sessionStorage.setItem("auth.refreshToken", newRefreshToken);

        processQueue(null, accessToken);
        isRefreshing = false;
        return apiFetch<T>(url, options);
    }
    // This return handles all non-401 cases
    return handleApiResponse<T>(response);
}

export const authClient = {

    // --- Registration & Login ---
    async register(data: RegisterRequest): Promise<ApiResult<AuthSuccessResponse>> {
        return apiFetch<AuthSuccessResponse>(`${BASE_URL}/auth/register`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async login(data: LoginRequest): Promise<ApiResult<AuthSuccessResponse>> {
        return apiFetch<AuthSuccessResponse>(`${BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // --- Session Management ---
    async logout(data: LogoutRequest): Promise<ApiResult<LogoutResponse>> {
        const token = sessionStorage.getItem("auth.accessToken");
        const response = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
        });
        return handleApiResponse<LogoutResponse>(response);
    },

    async refresh(data: RefreshRequest): Promise<ApiResult<RefreshResponse>> {
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
        });
        return handleApiResponse<RefreshResponse>(response);
    },

    // --- Identity & Verification ---
    /**
     * getMe: Fetches the current user profile directly from the BFF.
     */
    async getMe(): Promise<ApiResult<AuthMeResponse>> {
        return apiFetch<AuthMeResponse>(`${BASE_URL}/auth/me`);
    },

    /**
     * verify: Returns the full token validation data (claims, session info)
     */
    async verify(): Promise<ApiResult<VerifyResponse>> {
        return apiFetch<VerifyResponse>(`${BASE_URL}/auth/verify`);
    },

    // --- Social Auth ---
    startGoogleOAuth(): void {
        window.location.href = `${BASE_URL}/auth/google/start`;
    },

    async exchangeGoogleCallback(data: GoogleExchangeRequest): Promise<ApiResult<AuthSuccessResponse>> {
        return apiFetch<AuthSuccessResponse>(`${BASE_URL}/auth/google/exchange`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {Authorization: ''}
        })
    },
}
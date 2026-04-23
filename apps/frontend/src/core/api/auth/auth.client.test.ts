import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authClient } from './auth.client';
import {GoogleExchangeRequest} from "@/src/core/api/auth/auth.types";

// mock all fetch commands
global.fetch = vi.fn();
const fetchMock = vi.mocked(global.fetch);

// authClient and its related function are the test targets
describe('authClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('should return AuthSuccessResponse on successful register', async () => {
            const mockResponse = {
                user: { id: '2', email: 'new@test.com', status: 'ACTIVE', roles: ['USER'] },
                tokens: { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600, tokenType: 'Bearer' },
                session: { id: 'sess_2', expiresAt: 'tomorrow' }
            };

            fetchMock.mockResolvedValue({
                ok: true,
                status: 201,
                json: async () => mockResponse,
            } as Response);

            const result = await authClient.register({
                email: 'new@test.com',
                password: 'StrongPassword123!'
            });

            expect(result).toMatchObject({
                ok: true,
                status: 201,
                data: mockResponse
            });
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/register'), expect.any(Object));
        });

        it('should return register validation error payload on 400', async () => {
            const mockError = { code: 'bad_request', message: 'Invalid register payload' };

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => mockError,
            } as Response);

            const result = await authClient.register({ email: 'bad', password: '123' });

            expect(result).toMatchObject({
                ok: false,
                status: 400,
                error: mockError
            });
        });
    });
    // login related tests
    describe('login', () => {
        it('should return AuthSuccessResponse on successful login (Happy Path)', async () => {
            const mockResponse = {
                user: { id: '1', email: 'test@test.com', status: 'active', roles: ['user'] },
                tokens: { accessToken: 'accestokenstring', refreshToken: 'refreshtokenstring', expiresIn: 3600, tokenType: 'Bearer' },
                session: { id: 'sess_1', expiresAt: 'tomorrow' }
            };

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            } as Response);

            const result = await authClient.login({ email: 'test@test.com', password: 'password123' });

            expect(result).toMatchObject({
                ok: true,
                data: mockResponse
            });
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.any(Object));
        });

        it('should throw an ApiError when the server returns 401 (Error Path)', async () => {
            const mockError = { code: 'UNAUTHORIZED', message: 'Invalid credentials' };

            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => mockError,
            } as Response);

            const result = await authClient.login({ email: 'wrong@test.com', password: 'wrong' });
            expect(result).toMatchObject({
                ok: false,
                status: 401,
                error: mockError
            });
        });

        it('should handle 204 No Content correctly', async () => {
            localStorage.setItem("accessToken", "fake-access-token");
            fetchMock.mockResolvedValue({
                ok: true,
                status: 204,
                json: async () => ({}),
            } as Response);

            const result = await authClient.logout({ refreshToken: 'some_token' });

            expect(result).toMatchObject({
                ok: true,
                status: 204,
                data: {}
            });

            // Verify the header was actually sent
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/logout'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer fake-access-token'
                    })
                })
            );
        });

        it('should throw a specific error when the server returns 429 (Rate Limit)', async () => {
            const mockRateLimitError = { message: 'Too many login attempts' };

            fetchMock.mockResolvedValue({
                ok: false,
                status: 429,
                json: async () => mockRateLimitError,
            } as Response);

            const result = await authClient.login({ email: 'test@test.com', password: '123' });
            expect(result).toMatchObject({
                ok: false,
                status: 429,
                error: mockRateLimitError
            });
        });

    });
    // verify, getMe and refresh related test
    describe('verify', () => {
        it('should return an ApiResult containing the user identity and claims', async () => {
            const mockVerifyResponse = { user: { id: '123' }, claims: { exp: 1 } };

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockVerifyResponse,
            } as Response);

            const result = await authClient.verify();

            expect(result).toMatchObject({
                ok: true,
                status: 200,
                data: mockVerifyResponse
            });
        });
    });

    describe('getMe', () => {
        it('should return an ApiResult containing the current user identity data', async () => {
            const mockMeResponse = {
                user: {
                    id: '123',
                    email: 'me@test.com',
                    displayName: null,
                    username: null,
                    status: 'ACTIVE',
                    roles: ['USER']
                },
                session: { id: 'sess_1', expiresAt: 'tomorrow' },
                claims: { sub: '123', iat: 1, exp: 999, iss: 'auth-service' }
            };

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockMeResponse,
            } as Response);

            const result = await authClient.getMe();

            expect(result).toMatchObject({
                ok: true,
                status: 200,
                data: mockMeResponse
            });
        });
    });

    describe('refresh', () => {
        it('should send refreshToken in the request body', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ accessToken: 'new-at', refreshToken: 'new-rt' }),
            } as Response);

            const refreshData = { refreshToken: 'old-rt-string' };
            await authClient.refresh(refreshData);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/refresh'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(refreshData)
                })
            );
        });
    });
    // test google auth
    describe('Google OAuth', () => {
        beforeEach(() => {
            localStorage.clear();
        });
        it('should navigate to Google start endpoint', () => {
            Object.defineProperty(globalThis, 'window', {
                value: { location: { href: '' } },
                writable: true,
                configurable: true,
            });

            authClient.startGoogleOAuth();

            expect(window.location.href).toContain('/auth/google/start');

            delete (globalThis as { window?: unknown }).window;
        });

        it('should exchange the authorization code for tokens', async () => {
            const mockAuthResponse = {
                user: { id: 'google-user-123', email: 'google@test.com' },
                tokens: { accessToken: 'accestokenstring', refreshToken: 'refreshtokenstring' }
            };

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockAuthResponse,
            } as Response);

            const exchangeData: GoogleExchangeRequest = {
                authorizationCode: 'google-code-from-url',
                provider: 'google',
                // captures the origin of the current window otherwise default to localhost
                redirectUri: typeof window !== 'undefined'
                    ? `${window.location.origin}/auth/callback`
                    : 'http://localhost:3000/auth/callback'
            };

            const result = await authClient.exchangeGoogleCallback(exchangeData);
            expect(result).toMatchObject({
                ok: true,
                data: mockAuthResponse
            });
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/google/exchange'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': ''
                    })
                })
            );
        });
    });
});
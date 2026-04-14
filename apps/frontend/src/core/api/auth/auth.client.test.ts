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

            expect(result).toEqual(mockResponse);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.any(Object));
        });

        it('should throw an ApiError when the server returns 401 (Error Path)', async () => {
            const mockError = { code: 'UNAUTHORIZED', message: 'Invalid credentials' };

            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => mockError,
            } as Response);

            await expect(authClient.login({ email: 'wrong@test.com', password: 'wrong' }))
                .resolves.toMatchObject(mockError);
        });

        it('should handle 204 No Content correctly', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 204,
            } as Response);

            const result = await authClient.logout({ refreshToken: 'some_token' });
            expect(result).toEqual({});
        });

        it('should throw a specific error when the server returns 429 (Rate Limit)', async () => {
            const mockRateLimitError = { message: 'Too many login attempts' };

            fetchMock.mockResolvedValue({
                ok: false,
                status: 429,
                json: async () => mockRateLimitError,
            } as Response);

            const result = await authClient.login({ email: 'test@test.com', password: '123' });
            expect(result).toMatchObject(mockRateLimitError);
        });

    });
    // verify and refresh related test
    describe('verify & getMe', () => {
        it('should send the Authorization header in verify', async () => {
            const mockVerifyResponse = { user: { id: '123', email: 'me@test.com' } };

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockVerifyResponse,
            } as Response);

            await authClient.verify('fake-access-token');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/verify'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer fake-access-token'
                    })
                })
            );
        });

        it('should return only the user object when calling getMe', async () => {
            const mockVerifyResponse = {
                user: { id: '123', email: 'me@test.com' },
                claims: { exp: 123456 }
            };

            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockVerifyResponse,
            } as Response);

            const user = await authClient.getMe('fake-access-token');

            expect(user).toEqual(mockVerifyResponse.user);
            expect(user).not.toHaveProperty('claims');
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
            expect(result).toEqual(mockAuthResponse);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/google/exchange'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exchangeData)
                })
            );
        });
    });
});
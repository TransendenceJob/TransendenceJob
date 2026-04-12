import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authClient } from './auth.client';

// mock all fetch commands
global.fetch = vi.fn();

// authClient and its related function are the test target
describe('authClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should return AuthSuccessResponse on successful login (Happy Path)', async () => {
            const mockResponse = {
                user: { id: '1', email: 'test@test.com', status: 'active', roles: ['user'] },
                tokens: { accessToken: 'accestokenstring', refreshToken: 'refreshtokenstring', expiresIn: 3600, tokenType: 'Bearer' },
                session: { id: 'sess_1', expiresAt: 'tomorrow' }
            };

            (fetch as any).mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const result = await authClient.login({ email: 'test@test.com', password: 'password123' });

            expect(result).toEqual(mockResponse);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.any(Object));
        });

        it('should throw an ApiError when the server returns 401 (Error Path)', async () => {
            const mockError = { code: 'UNAUTHORIZED', message: 'Invalid credentials' };

            (fetch as any).mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => mockError,
            });

            await expect(authClient.login({ email: 'wrong@test.com', password: 'wrong' }))
                .rejects.toMatchObject(mockError);
        });

        it('should handle 204 No Content correctly', async () => {
            (fetch as any).mockResolvedValue({
                ok: true,
                status: 204,
            });

            const result = await authClient.logout({ refreshToken: 'some_token' });
            expect(result).toEqual({});
        });

        it('should throw a specific error when the server returns 429 (Rate Limit)', async () => {
            const mockRateLimitError = { message: 'Too many login attempts' };

            (fetch as any).mockResolvedValue({
                ok: false,
                status: 429,
                json: async () => mockRateLimitError,
            });

            await expect(authClient.login({ email: 'test@test.com', password: '123' }))
                .rejects.toMatchObject({
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Too many login attempts'
                });
        });

        it('should fallback to a generic error if the server returns non-JSON (Parsing Error)', async () => {
            (fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                // Simulate a crash where json() throws because the body is HTML
                json: async () => { throw new Error('Not JSON'); },
            });

            await expect(authClient.login({ email: 'test@test.com', password: '123' }))
                .rejects.toMatchObject({
                    code: 'SERVER_ERROR',
                    message: 'An unexpected error occurred'
                });
        });
    });
});
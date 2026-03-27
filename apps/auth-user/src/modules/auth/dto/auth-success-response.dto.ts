export class AuthSuccessResponseDto {
    user: {
        id: string;
        email: string;
        displayName?: string;
        status: 'active' | 'disabled' | 'pending';
        roles: string[];
        providers: {
            name: string;
            providerUserId: string;
        }[];
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    };
    session: {
        id: string;
        expiresAt: string;
    };
}
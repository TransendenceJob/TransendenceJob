import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersAuthService} from "../users-auth/users-auth.service";
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    private readonly usersService: UsersAuthService;
    private readonly jwtService: JwtService
    constructor(
        usersService: UsersAuthService,
        jwtService: JwtService
    ) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }

    async login(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);

        if (user) {
            const isMatch = await bcrypt.compare(pass, user.passwordHash);
            if (isMatch) {
                if (user.status === 'disabled') {
                    throw new UnauthorizedException('Account is disabled');
                }

                return this.generateSuccessResponse(user);
            }
        }

        // Generic error for both "User not found" and "Wrong password"
        throw new UnauthorizedException('Invalid email or password');
    }

    private async generateSuccessResponse(user: any) {
        const payload = { sub: user.id, email: user.email, roles: user.roles };

        return {
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
                roles: user.roles,
                displayName: user.displayName,
            },
            tokens: {
                accessToken: await this.jwtService.signAsync(payload),
                refreshToken: 'rt_' + Math.random().toString(36).substring(7),
                expiresIn: 900,
                tokenType: 'Bearer',
            },
            session: {
                id: 'sess_' + Math.random().toString(36).substring(7),
                expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
        };
    }

}
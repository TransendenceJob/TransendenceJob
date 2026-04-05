import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersAuthService {
    // Debug Mock users.

    private mockUsers = [
        {
            id: 'usr_123',
            email: 'stefan@example.com',
            // bcrypt.hash("StrongPassword123!", 10) creates the following hash
            passwordHash: '$2b$10$CJsf2eBb41Ih5AGEX5iY6uW6H7pp5oQx2Ap8SBS0NvYZ8YqeIVZfe',
            status: 'active',
            roles: ['user'],
            displayName: 'Stefan',
        },
    ];

    async findByEmail(email: string) {
        const user = this.mockUsers.find((u) => u.email === email);
        return user || null;
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }
}
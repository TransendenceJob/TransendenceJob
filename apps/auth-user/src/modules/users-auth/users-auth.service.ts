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
            passwordHash: '$2b$10$X7lR.fP5E1B.9vG7zYtOue5uK2V7S6W3lB6D.y/5G5Z1e5f8f8f8f',
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
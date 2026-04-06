import {Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";

@Injectable()

export class UsersAuthService {
    constructor(
        private prisma: PrismaService,
    ) {
    }


    async findByEmail(email: string) {
      const user = await this.prisma.user.findUnique({
            where: {email},
          // 'include' tells Prisma to follow the relations (JOINs)
          // We go from User -> UserRole (middle table) -> Role (actual name)
            include: {
                roles: {
                    include: {
                        role: true
                    }
                }
            }
        });
      if (!user) return null;
        //Prisma returns a deeply nested object (user.roles[0].role.name)
      // map it here so the AuthService gets a clean string array like ['ADMIN', 'USER'].
      const roleNames = user.roles.map((userRole) => userRole.role.name);
      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        disabledAt: user.disabledAt,
        roleNames,
      };
    }
}

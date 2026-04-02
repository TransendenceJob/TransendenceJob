import { UserRoleDto } from '../enums/user-role.enum';

export class UserRolesResponseDto {
  userId!: string;
  roles!: UserRoleDto[];
  updatedAt!: string;
}

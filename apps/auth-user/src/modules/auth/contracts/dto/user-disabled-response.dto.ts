import { UserStatusDto } from '../enums/user-status.enum';

export class UserDisabledResponseDto {
  userId!: string;
  status!: UserStatusDto;
  revokedSessions!: number;
}

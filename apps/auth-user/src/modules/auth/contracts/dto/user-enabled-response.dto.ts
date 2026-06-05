import { UserStatusDto } from '../enums/user-status.enum';

export class UserEnabledResponseDto {
  userId!: string;
  status!: UserStatusDto;
}

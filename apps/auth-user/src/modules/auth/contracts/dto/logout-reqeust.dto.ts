import { IsBoolean, IsString } from 'class-validator';

export class LogoutRequestDto {
  @IsString()
  refreshToken!: string;

  @IsBoolean()
  logoutAll: boolean = false;
}

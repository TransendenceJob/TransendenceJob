import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LogoutRequestDto {
  @IsString()
  refreshToken!: string;

  @IsOptional()
  @IsBoolean()
  logoutAll: boolean = false;
}

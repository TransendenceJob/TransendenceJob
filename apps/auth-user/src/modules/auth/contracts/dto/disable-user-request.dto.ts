import { IsBoolean, IsString, Length } from 'class-validator';

export class DisableUserRequestDto {
  @IsString()
  @Length(3, 255)
  reason!: string;
  @IsBoolean()
  revokeSessions!: boolean;
}

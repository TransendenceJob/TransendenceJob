import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RevokeSessionsRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

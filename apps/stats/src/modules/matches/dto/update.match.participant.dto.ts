import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateMatchParticipantDto {
  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isWinner?: boolean;

  @IsOptional()
  @IsInt()
  kills?: number;

  @IsOptional()
  @IsInt()
  deaths?: number;
}

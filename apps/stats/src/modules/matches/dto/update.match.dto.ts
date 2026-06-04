import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

enum MatchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export class UpdateMatchDto {
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @IsOptional()
  @IsInt()
  duration?: number | null;

  @IsOptional()
  @IsString()
  mode?: string | null;

  @IsOptional()
  @IsString()
  mapName?: string | null;

  @IsOptional()
  @IsString()
  score?: string | null;

  @IsOptional()
  @IsString()
  summary?: string | null;

  @IsOptional()
  @IsString()
  endedAt?: string | null;
}
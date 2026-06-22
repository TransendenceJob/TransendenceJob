import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateAchievementDto {
  @IsUUID()
  userId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  xpReward?: number;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsNumber()
  progressTarget?: number;

  @IsOptional()
  @IsBoolean()
  achieved?: boolean;

  @IsOptional()
  @IsDateString()
  achievedAt?: string;

  @IsOptional()
  @IsObject()
  meta?: any;
}

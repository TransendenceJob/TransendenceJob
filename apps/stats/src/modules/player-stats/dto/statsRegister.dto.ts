import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateStatsDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsOptional()
  xp?: number;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsNumber()
  @IsOptional()
  wins?: number;

  @IsNumber()
  @IsOptional()
  losses?: number;

  @IsNumber()
  @IsOptional()
  kills?: number;

  @IsNumber()
  @IsOptional()
  deaths?: number;

  @IsNumber()
  @IsOptional()
  damageDealt?: number;

  @IsNumber()
  @IsOptional()
  damageTaken?: number;

  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}

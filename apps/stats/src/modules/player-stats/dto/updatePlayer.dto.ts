import { IsString, IsNumber, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class UpdatePlayerDto {
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

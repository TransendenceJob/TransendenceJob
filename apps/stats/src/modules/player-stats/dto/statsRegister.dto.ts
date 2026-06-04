import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateStatsDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  userId!: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  matchesWon?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  matchesLost?: string[];

  @IsArray()
  @IsOptional()
  achievements?: Array<string | { id?: string; type?: string; name?: string }>;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  weapons?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  matchParticipants?: string[];

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
  createdAt?: string;

  @IsDateString()
  @IsOptional()
  updatedAt?: string;
}

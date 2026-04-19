import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum MatchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS', // game started
  FINISHED = 'FINISHED', // game ended
}

export class CreateMatchParticipantDto {
  @IsUUID()
  userId!: string;

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

export class CreateMatchDto {
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateMatchParticipantDto)
  participants!: CreateMatchParticipantDto[];
}

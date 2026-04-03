import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditActionDto } from '../enums/audit-action.enum';

export class AuditQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userId?: string;

  @IsOptional()
  @IsEnum(AuditActionDto)
  action?: AuditActionDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

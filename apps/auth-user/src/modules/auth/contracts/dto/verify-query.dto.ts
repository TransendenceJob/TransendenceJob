import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  audience?: string;
}

import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateMatchParticipantDto {
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

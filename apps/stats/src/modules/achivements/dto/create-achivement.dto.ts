import { IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateAchievementDto {
  @IsUUID()
  userId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsDateString()
  achivedAt?: Date;
}

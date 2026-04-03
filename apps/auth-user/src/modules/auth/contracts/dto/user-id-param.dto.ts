import { IsString, MaxLength } from 'class-validator';

export class UserIdParamDto {
  @IsString()
  @MaxLength(100)
  userId!: string;
}

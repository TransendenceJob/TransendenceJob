import { IsOptional, IsString, Length } from 'class-validator';

export class EnableUserRequestDto {
  @IsOptional()
  @IsString()
  @Length(3, 255)
  reason?: string;
}

import { IsString, Length } from 'class-validator';

export class SetPasswordRequestDto {
  @IsString()
  @Length(8, 128)
  password!: string;
}

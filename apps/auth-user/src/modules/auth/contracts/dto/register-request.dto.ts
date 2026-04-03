import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Length(8, 128)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(2, 32)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(3, 24)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username?: string;
}

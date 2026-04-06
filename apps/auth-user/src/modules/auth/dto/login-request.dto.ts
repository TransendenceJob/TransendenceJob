import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

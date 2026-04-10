import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { AuthProviderNameDto } from '../enums/auth-provider-name.enum';

@ValidatorConstraint({ name: 'GoogleExchangeOneOf', async: false })
class GoogleExchangeOrderOneOfValidator implements ValidatorConstraintInterface {
  validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    const dto = validationArguments?.object as GoogleExchangeRequestDto;
    const hasAuthCodeFlow = !!dto.authorizationCode && !!dto.redirectUri;
    const hasIdTokenFlow = !!dto.idToken;
    return hasAuthCodeFlow || hasIdTokenFlow;
  }

  defaultMessage(): string {
    return 'Either authorizationCode + redirectUri or idToken must be provided.';
  }
}

export class GoogleExchangeRequestDto {
  @IsEnum(AuthProviderNameDto)
  provider!: AuthProviderNameDto;

  @IsOptional()
  @IsString()
  authorizationCode?: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true, require_host: true })
  redirectUri?: string;

  @Validate(GoogleExchangeOrderOneOfValidator)
  oneOfValidator!: true;
}

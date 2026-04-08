import {
  type AuthMeResponseDto,
  type AuthSuccessResponseDto,
  type InternalAuthSuccessResponse,
  type InternalLogoutResponse,
  type InternalRefreshResponse,
  type InternalVerifyResponse,
  type LogoutResponseDto,
  type RefreshResponseDto,
  type VerifyResponseDto,
} from '../dto/auth-contracts.dto';

export class AuthContractMapper {
  static toAuthSuccess(
    internal: InternalAuthSuccessResponse,
  ): AuthSuccessResponseDto {
    return {
      success: true,
      user: internal.user,
      tokens: internal.tokens,
      session: internal.session,
    };
  }

  static toRefreshResponse(
    internal: InternalRefreshResponse,
  ): RefreshResponseDto {
    return {
      success: true,
      tokens: internal.tokens,
      session: internal.session,
    };
  }

  static toLogoutResponse(internal: InternalLogoutResponse): LogoutResponseDto {
    return {
      success: true,
      revokedSessionIds: internal.revokedSessionIds,
    };
  }

  static toVerifyResponse(internal: InternalVerifyResponse): VerifyResponseDto {
    return {
      success: true,
      valid: internal.valid,
      user: internal.user,
      session: internal.session,
      claims: internal.claims,
    };
  }

  static toMeResponse(internal: InternalVerifyResponse): AuthMeResponseDto {
    return {
      success: true,
      user: internal.user,
      session: internal.session,
      claims: internal.claims,
    };
  }
}

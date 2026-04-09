import { UserAuthViewModel } from '../view-models/user-auth.view-model';
import { SessionInfoViewModel } from '../view-models/session-info.view-model';
import { VerifyClaimsViewModel } from '../view-models/verify-claims.view-model';

export class VerifyResponseDto {
  valid!: boolean;
  user!: UserAuthViewModel;
  session!: SessionInfoViewModel;
  claims!: VerifyClaimsViewModel;
}

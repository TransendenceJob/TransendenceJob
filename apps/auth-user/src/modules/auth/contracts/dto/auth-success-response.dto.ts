import { UserAuthViewModel } from '../view-models/user-auth.view-model';
import { SessionInfoViewModel } from '../view-models/session-info.view-model';
import { TokenPairViewModel } from '../view-models/token-pair.view-model';

export class AuthSuccesResponseDto {
  user!: UserAuthViewModel;
  tokens!: TokenPairViewModel;
  session!: SessionInfoViewModel;
}

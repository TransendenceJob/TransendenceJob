import { SessionInfoViewModel } from '../view-models/session-info.view-model';
import { TokenPairViewModel } from '../view-models/token-pair.view-model';

export class RefreshResponseDto {
  tokens!: TokenPairViewModel;
  session!: SessionInfoViewModel;
}

import { PageInfoViewModel } from '../view-models/page-info.view-model';
import { UserAuthViewModel } from '../view-models/user-auth.view-model';

export class UserSearchResponseDto {
  items!: UserAuthViewModel[];
  pageInfo!: PageInfoViewModel;
}

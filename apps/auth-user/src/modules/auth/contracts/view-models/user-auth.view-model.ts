import { UserRoleDto } from '../enums/user-role.enum';
import { UserStatusDto } from '../enums/user-status.enum';
import { ProviderLinkViewModel } from './provider-link.view-model';

export class UserAuthViewModel {
  id!: string;
  email!: string;
  displayName?: string | null;
  username?: string | null;
  status!: UserStatusDto;
  roles!: UserRoleDto[];
  createdAt?: string | null;
  providers?: ProviderLinkViewModel[];
}

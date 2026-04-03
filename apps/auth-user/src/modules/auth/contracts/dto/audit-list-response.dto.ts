import { AuditLogItemViewModel } from '../view-models/audit-log-item.view-model';
import { PageInfoViewModel } from '../view-models/page-info.view-model';

export class AuditListResponseDto {
  items!: AuditLogItemViewModel[];
  pageInfo!: PageInfoViewModel;
}

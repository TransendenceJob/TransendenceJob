import { ArrayMinSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { UserRoleDto } from '../enums/user-role.enum';

export class SetUserRolesRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(UserRoleDto, { each: true })
  roles!: UserRoleDto[];
}

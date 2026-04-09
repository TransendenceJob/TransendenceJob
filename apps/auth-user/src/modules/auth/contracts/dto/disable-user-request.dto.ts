import { IsBoolean, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class DisableUserRequestDto {
  @IsString()
  @Length(3, 255)
  reason!: string;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0') return false;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    return value;
  })
  @IsBoolean()
  revokeSessions: boolean = true;
}

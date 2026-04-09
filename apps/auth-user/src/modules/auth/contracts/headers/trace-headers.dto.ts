import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class TraceHeadersDto {
  @IsOptional()
  @IsUUID()
  xRequestId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  xServiceName?: string;
}

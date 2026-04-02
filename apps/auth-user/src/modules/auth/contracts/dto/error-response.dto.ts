export class ErrorResponseDto {
  code!: string;
  message!: string;
  details: Record<string, unknown> | null;
}

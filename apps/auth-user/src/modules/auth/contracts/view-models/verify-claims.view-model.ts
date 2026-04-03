export class VerifyClaimsViewModel {
  sub!: string;
  iat!: number;
  exp!: number;
  iss!: string;
  aud?: string | null;
}

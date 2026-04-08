declare namespace Express {
  interface Request {
    requestId?: string;
    serviceName?: string;
    bearerToken?: string;
    userAgent?: string | null;
  }
}

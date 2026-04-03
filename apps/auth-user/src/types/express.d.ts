declare namespace Express {
  interface Request {
    requestId?: string;
    serviceName?: string;
  }
}

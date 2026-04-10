import { registerAs, type ConfigType } from '@nestjs/config';
import { validateEnv } from './env.validation';

type BffConfigShape = {
  app: {
    nodeEnv: string;
    port: number;
    serviceName: string;
  };
  auth: {
    serviceUrl: string;
    google: {
      clientId: string;
      redirectUri: string;
      stateSecret: string;
      frontendCallbackUrl: string;
    };
  };
};

export const bffConfig = registerAs<BffConfigShape>(
  'bff',
  (): BffConfigShape => {
    const env = validateEnv(process.env);

    return {
      app: {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        serviceName: env.SERVICE_NAME,
      },
      auth: {
        serviceUrl: env.AUTH_SERVICE_URL,
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          redirectUri: env.GOOGLE_REDIRECT_URI,
          stateSecret: env.GOOGLE_STATE_SECRET,
          frontendCallbackUrl: env.GOOGLE_FRONTEND_CALLBACK_URL,
        },
      },
    };
  },
);

export type BffConfig = ConfigType<typeof bffConfig>;

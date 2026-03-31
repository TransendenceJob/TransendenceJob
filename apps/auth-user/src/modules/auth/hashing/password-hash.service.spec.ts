import { PasswordHashService } from './password-hash.service';
import { type AuthConfigService } from '../../config/auth-config.service';

describe('PasswordHashService', () => {
  it('hashes and verifies with bcrypt', async () => {
    const config = {
      passwordHashing: {
        algorithm: 'bcrypt',
        bcryptRounds: 10,
      },
    } as AuthConfigService;

    const service = new PasswordHashService(config);
    const hash = await service.hashPassword('secret123');

    expect(hash).not.toBe('secret123');
    await expect(service.verifyPassword('secret123', hash)).resolves.toBe(true);
    await expect(service.verifyPassword('wrong', hash)).resolves.toBe(false);
  });

  it('hashes and verifies with argon2', async () => {
    const config = {
      passwordHashing: {
        algorithm: 'argon2',
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      },
    } as AuthConfigService;

    const service = new PasswordHashService(config);
    const hash = await service.hashPassword('secret123');

    expect(hash).not.toBe('secret123');
    await expect(service.verifyPassword('secret123', hash)).resolves.toBe(true);
    await expect(service.verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});

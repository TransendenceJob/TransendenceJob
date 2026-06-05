import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

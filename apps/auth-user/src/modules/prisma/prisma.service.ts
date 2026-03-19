import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client/extension";


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit , OnModuleDestroy{

	
	async onModuleInit(): Promise<void> {
		await this.$connect();
	}
	
	async onModuleDestroy(): Promise<void> {
		await this.$disconnect();
	}

	async enableShutdownHooks(app: INestApplication): Promise<void>{
		process.on('beforeExit', async () =>{
			await app.close();
		});
	}
}
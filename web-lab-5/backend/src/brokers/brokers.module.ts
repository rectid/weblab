import { Module } from '@nestjs/common'
import { BrokersService } from './brokers.service'
import { BrokersController } from './brokers.controller'
import { StocksModule } from '../stocks/stocks.module'

@Module({
	imports: [StocksModule],
	providers: [BrokersService],
	controllers: [BrokersController],
	exports: [BrokersService],
})
export class BrokersModule {}

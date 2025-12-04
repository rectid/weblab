import { Module } from '@nestjs/common'
import { TradingService } from './trading.service'
import { TradingController } from './trading.controller'
import { StocksModule } from '../stocks/stocks.module'
import { WebsocketGateway } from '../websocket/websocket.gateway'

@Module({
	imports: [StocksModule],
	providers: [TradingService, WebsocketGateway],
	controllers: [TradingController],
	exports: [TradingService]
})
export class TradingModule {}

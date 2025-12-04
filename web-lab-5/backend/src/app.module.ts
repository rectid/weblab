import { Module } from '@nestjs/common';
import { BrokersModule } from './brokers/brokers.module';
import { StocksModule } from './stocks/stocks.module';
import { TradingModule } from './trading/trading.module';
import { WebsocketModule } from './websocket/websocket.module';
import { RootController } from './root.controller';

@Module({
  imports: [BrokersModule, StocksModule, TradingModule, WebsocketModule],
  controllers: [RootController],
})
export class AppModule {}
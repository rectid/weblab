import { Controller, Get, Param, Put, Body, NotFoundException } from '@nestjs/common'
import { StocksService } from './stocks.service'

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  getAll() {
    return this.stocksService.getAllStocks()
  }

  @Get(':symbol')
  getOne(@Param('symbol') symbol: string) {
    const s = this.stocksService.getStock(symbol)
    if (!s) throw new NotFoundException('Stock not found')
    return s
  }

  @Put(':symbol')
  update(@Param('symbol') symbol: string, @Body() body: any) {
    const updated = this.stocksService.updateStock(symbol, body)
    if (!updated) throw new NotFoundException('Stock not found')
    return updated
  }
}

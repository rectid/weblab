import { Controller, Get, Post, Body, Param, Put, Delete, NotFoundException, BadRequestException } from '@nestjs/common'
import { BrokersService } from './brokers.service'
import { StocksService } from '../stocks/stocks.service'

@Controller('brokers')
export class BrokersController {
	constructor(
		private readonly brokersService: BrokersService,
		private readonly stocksService: StocksService
	) {}

	@Get()
	getAll(){
		return this.brokersService.getAll()
	}

	@Get(':id')
	getOne(@Param('id') id: string){
		const b = this.brokersService.get(id)
		if (!b) throw new NotFoundException('Broker not found')
		return b
	}

	@Post()
	create(@Body() body: any){
		return this.brokersService.create(body)
	}

	@Put(':id')
	update(@Param('id') id: string, @Body() body: any){
		const updated = this.brokersService.update(id, body)
		if (!updated) throw new NotFoundException('Broker not found')
		return updated
	}

	@Delete(':id')
	remove(@Param('id') id: string){
		const ok = this.brokersService.delete(id)
		if (!ok) throw new NotFoundException('Broker not found')
		return { ok: true }
	}

	@Post(':id/buy')
	buy(@Param('id') id: string, @Body() body: { symbol: string; quantity: number }) {
		const { symbol, quantity } = body
		if (!symbol || !quantity || quantity <= 0) {
			throw new BadRequestException('Invalid symbol or quantity')
		}
		
		// Get current stock price
		const stocks = this.stocksService.getAllStocks()
		const stock = stocks.find(s => s.symbol === symbol)
		if (!stock) {
			throw new NotFoundException('Stock not found')
		}
		
		const price = stock.currentPrice || stock.history[stock.history.length - 1]?.open || 0
		if (price <= 0) {
			throw new BadRequestException('Invalid stock price')
		}
		
		const result = this.brokersService.buyStock(id, symbol, quantity, price)
		if (!result.success) {
			throw new BadRequestException(result.message)
		}
		
		return result
	}

	@Post(':id/sell')
	sell(@Param('id') id: string, @Body() body: { symbol: string; quantity: number }) {
		const { symbol, quantity } = body
		if (!symbol || !quantity || quantity <= 0) {
			throw new BadRequestException('Invalid symbol or quantity')
		}
		
		// Get current stock price
		const stocks = this.stocksService.getAllStocks()
		const stock = stocks.find(s => s.symbol === symbol)
		if (!stock) {
			throw new NotFoundException('Stock not found')
		}
		
		const price = stock.currentPrice || stock.history[stock.history.length - 1]?.open || 0
		if (price <= 0) {
			throw new BadRequestException('Invalid stock price')
		}
		
		const result = this.brokersService.sellStock(id, symbol, quantity, price)
		if (!result.success) {
			throw new BadRequestException(result.message)
		}
		
		return result
	}

	@Get(':id/portfolio')
	getPortfolio(@Param('id') id: string) {
		const stocks = this.stocksService.getAllStocks()
		const currentPrices: { [symbol: string]: number } = {}
		
		stocks.forEach(stock => {
			currentPrices[stock.symbol] = stock.currentPrice || stock.history[stock.history.length - 1]?.open || 0
		})
		
		const portfolio = this.brokersService.getPortfolio(id, currentPrices)
		if (!portfolio) {
			throw new NotFoundException('Broker not found')
		}
		
		return portfolio
	}

	@Post(':id/reset')
	reset(@Param('id') id: string) {
		const broker = this.brokersService.resetBroker(id)
		if (!broker) {
			throw new NotFoundException('Broker not found')
		}
		return broker
	}
}

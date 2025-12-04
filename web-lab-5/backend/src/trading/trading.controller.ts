import { Controller, Get, Post, Body } from '@nestjs/common'
import { TradingService } from './trading.service'

@Controller('trading')
export class TradingController {
	constructor(private readonly trading: TradingService) {}

	@Get('settings')
	getSettings(){
		return this.trading.getSettings()
	}

	@Post('settings')
	updateSettings(@Body() body: any){
		return this.trading.updateSettings(body)
	}

	@Post('start')
	// Accept optional body { participants: string[] } to explicitly set
	// which symbols to lock for the run. If omitted, server snapshots
	// currently active stocks.
	start(@Body() body?: any){
		const participants: string[] | undefined = body && Array.isArray(body.participants) ? body.participants : undefined
		return this.trading.start(participants)
	}

	@Post('stop')
	stop(){
		return this.trading.stop()
	}

	@Post('pause')
	pause(){
		return this.trading.pause()
	}

	@Post('resume')
	resume(){
		return this.trading.resume()
	}

	@Post('reset')
	reset(){
		return this.trading.reset()
	}

	@Get('participants')
	getParticipants(){
		return { participants: this.trading.getParticipants() }
	}
}

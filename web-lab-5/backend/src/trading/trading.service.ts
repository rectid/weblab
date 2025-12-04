import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { StocksService } from '../stocks/stocks.service'
import { WebsocketGateway } from '../websocket/websocket.gateway'
import { TradingSettings } from '../shared/types'

@Injectable()
export class TradingService implements OnModuleDestroy {
  private settings: TradingSettings = { startDate: '', speed: 1, isActive: false, currentDateIndex: 0 }
  private timer: NodeJS.Timeout | null = null
  private dateList: string[] = []
  private lastMetaVersion = 0
  private lockedSymbols: string[] = []

  private toIso(dateStr: string){
    // try to parse various incoming date formats and return YYYY-MM-DD
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toISOString().slice(0,10)
  }

  constructor(private stocksService: StocksService, private ws: WebsocketGateway) {}

  getSettings(){
    return this.settings
  }

  updateSettings(updates: Partial<TradingSettings>){
    // Clamp speed to non-negative to prevent storing negative speeds
    if (updates.speed !== undefined && typeof updates.speed === 'number') {
      updates.speed = Math.max(0, updates.speed)
    }
    this.settings = { ...this.settings, ...updates }
    return this.settings
  }

  // start optionally with an explicit participants list. If `participants` is
  // provided, use it as the locked snapshot; otherwise snapshot currently
  // active stocks from StocksService.
  start(participants?: string[]){
    // If already active, return current settings (do not snapshot again)
    if (this.settings.isActive) return this.settings
    if (participants && participants.length) {
      this.lockedSymbols = participants.slice()
    } else {
      // capture lockedSymbols at start (snapshot of currently active stocks)
      this.lockedSymbols = this.stocksService.getAllStocks().filter(s => !!s.isActive).map(s => s.symbol)
    }
    if (!this.lockedSymbols.length) throw new Error('No active stocks available for simulation')

    console.log('Locked symbols at start:', this.lockedSymbols)

    // build unified sorted dateList from lockedSymbols
    const set = new Set<string>()
    this.stocksService.getAllStocks().filter(s => this.lockedSymbols.includes(s.symbol)).forEach(s => s.history.forEach(h => set.add(this.toIso(h.date))))
    this.dateList = Array.from(set).sort()

    // find start index by normalized ISO date
    const startIso = this.settings.startDate ? this.toIso(this.settings.startDate) : ''
    const idx = startIso ? this.dateList.indexOf(startIso) : 0
    this.settings.currentDateIndex = idx >= 0 ? idx : 0
    this.settings.isActive = true

    this.lastMetaVersion = this.stocksService.getMetaVersion()

    this.emitState()

    this.timer = setInterval(()=> this.tick(), Math.max(100, this.settings.speed*1000))
    console.log(`Trading started, dateList length=${this.dateList.length}, startIndex=${this.settings.currentDateIndex}, intervalMs=${Math.max(100, this.settings.speed*1000)}, participants=${this.lockedSymbols.length}`)
    return this.settings
  }

  stop(){
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    this.settings.isActive = false
    // stopping acts as pause: keep lockedSymbols so resume continues same participants
    this.emitState()
    return this.settings
  }

  pause(){
    // explicit alias for stop (keeps lockedSymbols intact)
    return this.stop()
  }

  resume(){
    if (this.settings.isActive) return this.settings
    if (!this.lockedSymbols.length) throw new Error('No locked symbols to resume')
    // rebuild dateList from lockedSymbols (in case underlying data changed)
    const set = new Set<string>()
    this.stocksService.getAllStocks().filter(s => this.lockedSymbols.includes(s.symbol)).forEach(s => s.history.forEach(h => set.add(this.toIso(h.date))))
    this.dateList = Array.from(set).sort()
    // clamp current index
    if (this.settings.currentDateIndex >= this.dateList.length) this.settings.currentDateIndex = 0
    this.settings.isActive = true
    this.timer = setInterval(()=> this.tick(), Math.max(100, this.settings.speed*1000))
    this.emitState()
    return this.settings
  }

  reset(){
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    this.settings.isActive = false
    this.settings.currentDateIndex = 0
    this.dateList = []
    this.lockedSymbols = []
    this.emitState()
    return this.settings
  }

  getParticipants(){
    // If simulation is currently active, return the locked snapshot of participants.
    // When not active (after reset/stop), always return the up-to-date active
    // stocks from StocksService so UI reset behavior reflects `isActive` flags.
    if (this.settings.isActive && this.lockedSymbols && this.lockedSymbols.length) {
      return this.lockedSymbols
    }
    return this.stocksService.getAllStocks().filter(s => !!s.isActive).map(s => s.symbol)
  }

  private tick(){
    if (!this.settings.isActive) return
    const idx = this.settings.currentDateIndex
    if (idx >= this.dateList.length){
      // stop when out of data
      this.stop()
      return
    }

    const currentIso = this.dateList[idx]
    // build price list only for locked participant symbols
    const stocks = this.stocksService.getAllStocks().filter(s => this.lockedSymbols.includes(s.symbol))
    const prices = stocks.map(s => {
      const point = s.history.find(h => this.toIso(h.date) === currentIso)
      const price = point ? point.open : (s.currentPrice ?? 0)
      // update in-memory current price
      this.stocksService.setCurrentPrice(s.symbol, price)
      return { symbol: s.symbol, price }
    })

    try {
      console.log(`Trading tick idx=${idx} date=${currentIso} symbols=[${prices.map(p=>p.symbol).join(',')}]`)
    } catch (e) { }

    // emit via websocket (date in ISO format)
    this.ws.sendPriceUpdate({ date: currentIso, prices })
    this.settings.currentDateIndex += 1
    this.emitState()
  }

  private emitState(){
    // send the current participants view: locked symbols when running, otherwise
    // the currently active stocks. Use getParticipants() so reset() (which clears
    // lockedSymbols) will cause the websocket state to include the up-to-date
    // active symbols from StocksService.
    this.ws.sendTradingState({ settings: this.settings, participants: this.getParticipants() })
  }

  onModuleDestroy(){ this.stop() }
}

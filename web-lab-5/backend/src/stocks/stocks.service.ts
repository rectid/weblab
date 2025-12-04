import { Injectable } from '@nestjs/common'
import { Stock, StockData } from '../shared/types'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class StocksService {
  private readonly dataDir = path.join(__dirname, '../../data/stocks')
  private readonly metaPath = path.join(__dirname, '../../data/stocks_meta.json')
  private stocks: Stock[] = []
  private meta: Record<string, { isActive?: boolean }> = {}
  private metaVersion = 0

  constructor() {
    this.loadFromCsv()
  }

  // Load all CSV files from data/stocks directory. Each CSV should have a header with
  // at least 'Date' and 'Open' columns. The filename (without extension) is used as symbol.
  private loadFromCsv() {
    if (!fs.existsSync(this.dataDir)) return

    // load meta if exists
    this.loadMeta()

    const files = fs.readdirSync(this.dataDir).filter(f => f.toLowerCase().endsWith('.csv'))
    this.stocks = files.map((file) => {
      const full = path.join(this.dataDir, file)
      const raw = fs.readFileSync(full, 'utf8')
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length)
      if (lines.length < 2) return null

      const headers = lines[0].split(',').map(h => h.trim())
      const dateIdx = headers.findIndex(h => /date/i.test(h))
      const openIdx = headers.findIndex(h => /open/i.test(h))

      const history: StockData[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',')
        const date = cols[dateIdx] ? cols[dateIdx].trim() : ''
        let openRaw = cols[openIdx] ? cols[openIdx].trim() : ''
        // remove $ and any commas
        openRaw = openRaw.replace(/\$/g, '').replace(/,/g, '')
        const open = parseFloat(openRaw) || 0
        history.push({ date, open })
      }

      // symbol from filename (remove extension)
      const symbol = path.basename(file, path.extname(file))
      const isActive = this.meta[symbol] && typeof this.meta[symbol].isActive === 'boolean' ? !!this.meta[symbol].isActive : true
      return {
        symbol,
        company: symbol,
        isActive,
        history,
        currentPrice: history.length ? history[0].open : 0,
      } as Stock
    }).filter(Boolean) as Stock[]
  }

  private loadMeta(){
    try{
      if (fs.existsSync(this.metaPath)){
        const raw = fs.readFileSync(this.metaPath, 'utf8')
        this.meta = JSON.parse(raw)
      }
    }catch(e){ this.meta = {} }
  }

  private saveMeta(){
    try{ fs.writeFileSync(this.metaPath, JSON.stringify(this.meta, null, 2)) }catch(e){ /* ignore */ }
  }

  getMetaVersion(): number {
    return this.metaVersion
  }

  getAllStocks(): Stock[] {
    return this.stocks
  }

  getStock(symbol: string): Stock | undefined {
    return this.stocks.find(stock => stock.symbol === symbol)
  }

  // Update in-memory stock. Note: CSV files are treated as source of historical data;
  // updates (like toggling isActive) are kept in memory and not written back to CSV.
  updateStock(symbol: string, updates: Partial<Stock>): Stock | null {
    const stockIndex = this.stocks.findIndex(stock => stock.symbol === symbol)
    if (stockIndex === -1) return null

    this.stocks[stockIndex] = { ...this.stocks[stockIndex], ...updates }
    // persist isActive into meta so it survives restarts
    if (typeof updates.isActive === 'boolean'){
      const sym = this.stocks[stockIndex].symbol
      this.meta[sym] = this.meta[sym] || {}
      this.meta[sym].isActive = !!updates.isActive
      this.saveMeta()
      this.metaVersion += 1
    }
    return this.stocks[stockIndex]
  }

  setCurrentPrice(symbol: string, price: number): void {
    const stock = this.getStock(symbol)
    if (stock) stock.currentPrice = price
  }
}
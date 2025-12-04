import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import { Broker, Holding } from '../shared/types'

@Injectable()
export class BrokersService {
	private readonly dataPath = path.join(__dirname, '../../data/brokers.json')
	private brokers: Broker[] = []

	constructor(){
		this.load()
	}

	private load(){
		if (fs.existsSync(this.dataPath)){
			try{
				const raw = fs.readFileSync(this.dataPath, 'utf8')
				this.brokers = JSON.parse(raw)
				// Ensure all brokers have holdings
				this.brokers = this.brokers.map(b => ({
					...b,
					holdings: b.holdings || {}
				}))
			}catch(e){
				this.brokers = []
				this.save()
			}
		} else {
			this.brokers = []
			this.save()
		}
	}

	private save(){
		fs.writeFileSync(this.dataPath, JSON.stringify(this.brokers, null, 2))
	}

	getAll(): Broker[] { return this.brokers }

	get(id: string): Broker | undefined { return this.brokers.find(b=>b.id===id) }

	create(b: Partial<Broker>): Broker {
		const id = (Math.random()*1e9|0).toString()
		const initial = Math.max(0, b.initialBalance ?? 100000)
		const broker: Broker = {
			id,
			name: b.name || 'Unnamed',
			initialBalance: initial,
			currentBalance: initial,
			holdings: {}
		}
		this.brokers.push(broker)
		this.save()
		return broker
	}

	update(id: string, updates: Partial<Broker>): Broker | null {
		const idx = this.brokers.findIndex(b=>b.id===id)
		if (idx===-1) return null
		const existing = this.brokers[idx]
		// merge and enforce non-negative balances
		const merged: Broker = { ...existing, ...updates } as Broker
		if (typeof updates.initialBalance === 'number'){
			merged.initialBalance = Math.max(0, updates.initialBalance)
			// when initialBalance explicitly changed, sync currentBalance to it
			merged.currentBalance = merged.initialBalance
		}
		if (typeof updates.currentBalance === 'number'){
			merged.currentBalance = Math.max(0, updates.currentBalance)
		}
		const updated = merged
		this.brokers[idx] = updated
		this.save()
		return updated
	}

	delete(id: string): boolean {
		const idx = this.brokers.findIndex(b=>b.id===id)
		if (idx===-1) return false
		this.brokers.splice(idx,1)
		this.save()
		return true
	}

	// Trading methods
	buyStock(brokerId: string, symbol: string, quantity: number, price: number): { success: boolean; message: string; broker?: Broker } {
		const broker = this.get(brokerId)
		if (!broker) {
			return { success: false, message: 'Broker not found' }
		}
		
		const totalCost = quantity * price
		if (broker.currentBalance < totalCost) {
			return { success: false, message: 'Insufficient funds' }
		}
		
		// Update balance
		broker.currentBalance -= totalCost
		
		// Update holdings
		if (!broker.holdings) broker.holdings = {}
		const existing = broker.holdings[symbol]
		if (existing) {
			// Calculate new average price
			const totalQuantity = existing.quantity + quantity
			const totalValue = existing.quantity * existing.avgBuyPrice + quantity * price
			broker.holdings[symbol] = {
				quantity: totalQuantity,
				avgBuyPrice: totalValue / totalQuantity
			}
		} else {
			broker.holdings[symbol] = {
				quantity,
				avgBuyPrice: price
			}
		}
		
		this.save()
		return { success: true, message: 'Purchase successful', broker }
	}

	sellStock(brokerId: string, symbol: string, quantity: number, price: number): { success: boolean; message: string; broker?: Broker; profit?: number } {
		const broker = this.get(brokerId)
		if (!broker) {
			return { success: false, message: 'Broker not found' }
		}
		
		const holding = broker.holdings?.[symbol]
		if (!holding || holding.quantity < quantity) {
			return { success: false, message: 'Insufficient shares' }
		}
		
		// Calculate profit
		const profit = (price - holding.avgBuyPrice) * quantity
		
		// Update balance
		broker.currentBalance += quantity * price
		
		// Update holdings
		holding.quantity -= quantity
		if (holding.quantity === 0) {
			delete broker.holdings[symbol]
		}
		
		this.save()
		return { success: true, message: 'Sale successful', broker, profit }
	}

	getPortfolio(brokerId: string, currentPrices: { [symbol: string]: number }): { holdings: { symbol: string; quantity: number; avgBuyPrice: number; currentPrice: number; value: number; profit: number }[]; totalValue: number; totalProfit: number } | null {
		const broker = this.get(brokerId)
		if (!broker) return null
		
		const holdings = Object.entries(broker.holdings || {}).map(([symbol, h]) => {
			const currentPrice = currentPrices[symbol] || h.avgBuyPrice
			const value = h.quantity * currentPrice
			const profit = (currentPrice - h.avgBuyPrice) * h.quantity
			return {
				symbol,
				quantity: h.quantity,
				avgBuyPrice: h.avgBuyPrice,
				currentPrice,
				value,
				profit
			}
		})
		
		const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
		const totalProfit = holdings.reduce((sum, h) => sum + h.profit, 0)
		
		return { holdings, totalValue, totalProfit }
	}

	resetBroker(brokerId: string): Broker | null {
		const broker = this.get(brokerId)
		if (!broker) return null
		
		broker.currentBalance = broker.initialBalance
		broker.holdings = {}
		this.save()
		return broker
	}
}

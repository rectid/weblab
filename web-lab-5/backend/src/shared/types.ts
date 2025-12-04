export interface Holding {
  quantity: number;
  avgBuyPrice: number;
}

export interface Broker {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  holdings: { [symbol: string]: Holding };
}

export interface StockData {
  date: string;
  open: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface Stock {
  symbol: string;
  company: string;
  isActive: boolean;
  history: StockData[];
  currentPrice?: number;
}

export interface TradingSettings {
  startDate: string;
  speed: number; // seconds between updates
  isActive: boolean;
  currentDateIndex: number;
}
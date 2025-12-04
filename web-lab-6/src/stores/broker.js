import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const API_BASE = '/api'
// WebSocket connects from browser, so use localhost
const WS_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`

export const useBrokerStore = defineStore('broker', () => {
  const broker = ref(null)
  const stocks = ref([])
  const currentDate = ref('')
  const priceHistory = ref({}) // symbol -> [{date, price}]
  const socket = ref(null)
  const allBrokers = ref([]) // for admin view

  // Portfolio value = sum of (holdings * current price)
  const portfolioValue = computed(() => {
    if (!broker.value) return 0
    return Object.entries(broker.value.holdings || {}).reduce((sum, [symbol, holding]) => {
      const stock = stocks.value.find(s => s.symbol === symbol)
      const price = stock?.currentPrice || 0
      const qty = typeof holding === 'object' ? holding.quantity : holding
      return sum + qty * price
    }, 0)
  })

  // Total balance = cash + portfolio
  const totalBalance = computed(() => {
    if (!broker.value) return 0
    return (broker.value.currentBalance || 0) + portfolioValue.value
  })

  // Connect to websocket
  function connectSocket() {
    if (socket.value) return
    socket.value = io(WS_BASE)

    socket.value.on('connect', () => {
      console.log('Broker client connected to WS')
    })

    socket.value.on('priceUpdate', (data) => {
      currentDate.value = data.date
      // Update current prices in stocks array
      for (const p of data.prices || []) {
        const idx = stocks.value.findIndex(s => s.symbol === p.symbol)
        if (idx >= 0) {
          stocks.value[idx].currentPrice = p.price
        }
        // Accumulate price history for charts
        if (!priceHistory.value[p.symbol]) {
          priceHistory.value[p.symbol] = []
        }
        priceHistory.value[p.symbol].push({ date: data.date, price: p.price })
      }
    })

    socket.value.on('brokerUpdate', (data) => {
      // Update current broker if it's us
      if (broker.value && data.id === broker.value.id) {
        broker.value = { ...broker.value, ...data }
      }
      // Update all brokers list for admin
      const idx = allBrokers.value.findIndex(b => b.id === data.id)
      if (idx >= 0) {
        allBrokers.value[idx] = data
      } else {
        allBrokers.value.push(data)
      }
    })

    socket.value.on('allBrokers', (data) => {
      allBrokers.value = data || []
    })
  }

  async function fetchStocks() {
    const res = await axios.get(`${API_BASE}/stocks`)
    stocks.value = res.data
  }

  async function login(name) {
    const res = await axios.post(`${API_BASE}/brokers/login`, { name })
    broker.value = res.data
    connectSocket()
    await fetchStocks()
  }

  async function loginById(id) {
    const res = await axios.get(`${API_BASE}/brokers/${id}`)
    broker.value = res.data
    connectSocket()
    await fetchStocks()
  }

  function logout() {
    broker.value = null
    priceHistory.value = {}
  }

  async function buyStock(symbol, quantity) {
    if (!broker.value) return
    const res = await axios.post(`${API_BASE}/brokers/${broker.value.id}/buy`, { symbol, quantity })
    // API returns {success, message, broker}
    if (res.data.broker) {
      broker.value = res.data.broker
    }
  }

  async function sellStock(symbol, quantity) {
    if (!broker.value) return
    const res = await axios.post(`${API_BASE}/brokers/${broker.value.id}/sell`, { symbol, quantity })
    // API returns {success, message, broker, profit}
    if (res.data.broker) {
      broker.value = res.data.broker
    }
  }

  async function fetchAllBrokers() {
    const res = await axios.get(`${API_BASE}/brokers`)
    allBrokers.value = res.data
  }

  // Compute P&L for a holding
  function getPnL(symbol) {
    if (!broker.value?.holdings?.[symbol]) return 0
    const holding = broker.value.holdings[symbol]
    // holding can be {quantity, avgBuyPrice} or just a number
    const qty = typeof holding === 'object' ? holding.quantity : holding
    const avgCost = typeof holding === 'object' ? holding.avgBuyPrice : 0
    const stock = stocks.value.find(s => s.symbol === symbol)
    const currentPrice = stock?.currentPrice || 0
    return (currentPrice - avgCost) * qty
  }

  return {
    broker,
    stocks,
    currentDate,
    priceHistory,
    allBrokers,
    portfolioValue,
    totalBalance,
    fetchStocks,
    login,
    loginById,
    logout,
    buyStock,
    sellStock,
    fetchAllBrokers,
    connectSocket,
    getPnL
  }
})

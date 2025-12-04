<template>
  <div class="trading-view">
    <v-row>
      <v-col cols="12">
        <v-alert v-if="!brokerStore.broker" type="warning" variant="tonal" class="rounded-xl glassmorphic-alert">
          <v-icon start>mdi-alert-circle-outline</v-icon>
          <router-link to="/" class="text-primary font-weight-bold">Войдите</router-link>, чтобы торговать
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="brokerStore.broker">
      <!-- Summary cards -->
      <v-col cols="12" sm="6" md="4">
        <v-card class="stat-card stat-card-date">
          <div class="stat-card-icon">
            <v-icon size="32">mdi-calendar-clock</v-icon>
          </div>
          <v-card-title class="stat-label">Текущая дата</v-card-title>
          <v-card-text class="stat-value">
            {{ brokerStore.currentDate || '—' }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="4">
        <v-card class="stat-card stat-card-cash">
          <div class="stat-card-icon">
            <v-icon size="32">mdi-cash-multiple</v-icon>
          </div>
          <v-card-title class="stat-label">Свободные средства</v-card-title>
          <v-card-text class="stat-value" data-testid="broker-balance">
            ${{ brokerStore.broker.currentBalance?.toFixed(2) }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="12" md="4">
        <v-card class="stat-card stat-card-total">
          <div class="stat-card-icon">
            <v-icon size="32">mdi-wallet-outline</v-icon>
          </div>
          <v-card-title class="stat-label">Общий баланс</v-card-title>
          <v-card-text class="stat-value">
            ${{ brokerStore.totalBalance.toFixed(2) }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stocks table - Desktop -->
    <v-row v-if="brokerStore.broker" class="mt-4 d-none d-md-flex">
      <v-col cols="12">
        <v-card class="stocks-card">
          <v-card-title class="d-flex align-center py-4">
            <v-icon start color="primary" size="28">mdi-chart-timeline-variant-shimmer</v-icon>
            <span class="text-h6 font-weight-bold">Активные торги</span>
            <v-spacer />
            <v-chip color="primary" variant="tonal" size="small">
              {{ brokerStore.stocks.filter(s => s.isActive).length }} активных
            </v-chip>
          </v-card-title>
          <v-table density="comfortable" class="stocks-table">
            <thead>
              <tr>
                <th class="text-left">Акция</th>
                <th class="text-center">Статус</th>
                <th class="text-right">Цена</th>
                <th class="text-center">В портфеле</th>
                <th class="text-right">Стоимость</th>
                <th class="text-right">P/L</th>
                <th class="text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in brokerStore.stocks" :key="stock.symbol" :class="{ 'inactive-row': !stock.isActive }">
                <td>
                  <div class="d-flex align-center">
                    <v-avatar :color="stock.isActive ? 'primary' : 'grey'" size="36" class="mr-3">
                      <span class="text-white font-weight-bold text-caption">{{ stock.symbol.slice(0, 2) }}</span>
                    </v-avatar>
                    <div>
                      <div class="font-weight-bold">{{ stock.symbol }}</div>
                      <div class="text-caption text-grey">{{ stock.company }}</div>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <v-chip v-if="stock.isActive" color="success" size="small" variant="tonal">
                    <v-icon start size="12">mdi-chart-line</v-icon>
                    Активна
                  </v-chip>
                  <v-chip v-else color="grey" size="small" variant="tonal">
                    <v-icon start size="12">mdi-pause</v-icon>
                    Пауза
                  </v-chip>
                </td>
                <td class="text-right font-weight-bold text-h6">${{ stock.currentPrice?.toFixed(2) || '—' }}</td>
                <td class="text-center">
                  <v-chip variant="outlined" size="small">
                    {{ getHoldingQty(stock.symbol) }} шт.
                  </v-chip>
                </td>
                <td class="text-right">
                  ${{ (getHoldingQty(stock.symbol) * (stock.currentPrice || 0)).toFixed(2) }}
                </td>
                <td class="text-right">
                  <v-chip :color="pnlColor(stock.symbol)" variant="tonal" size="small" data-testid="pnl-chip">
                    {{ formatPnL(stock.symbol) }}
                  </v-chip>
                </td>
                <td class="text-center">
                  <v-btn-group variant="outlined" density="compact">
                    <v-btn 
                      color="success" 
                      size="small"
                      @click="openBuyDialog(stock)"
                      :disabled="!stock.isActive"
                      data-testid="buy-btn"
                    >
                      <v-icon size="18">mdi-plus</v-icon>
                    </v-btn>
                    <v-btn
                      color="error"
                      size="small"
                      :disabled="!stock.isActive || getHoldingQty(stock.symbol) <= 0"
                      @click="openSellDialog(stock)"
                      data-testid="sell-btn"
                    >
                      <v-icon size="18">mdi-minus</v-icon>
                    </v-btn>
                    <v-btn
                      color="primary"
                      size="small"
                      @click="openChart(stock.symbol)"
                    >
                      <v-icon size="18">mdi-chart-areaspline</v-icon>
                    </v-btn>
                  </v-btn-group>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stocks cards - Mobile -->
    <v-row v-if="brokerStore.broker" class="mt-2 d-flex d-md-none">
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-icon color="primary" class="mr-2">mdi-chart-timeline-variant-shimmer</v-icon>
          <span class="text-h6 font-weight-bold">Активные торги</span>
        </div>
      </v-col>
      <v-col cols="12" sm="6" v-for="stock in brokerStore.stocks" :key="stock.symbol + '-mobile'">
        <v-card class="stock-card-mobile" :class="{ 'stock-card-inactive': !stock.isActive }">
          <v-card-title class="d-flex align-center py-3 px-4">
            <v-avatar :color="stock.isActive ? 'primary' : 'grey'" size="40" class="mr-3">
              <span class="text-white font-weight-bold">{{ stock.symbol.slice(0, 2) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold">{{ stock.symbol }}</div>
              <v-chip :color="stock.isActive ? 'success' : 'grey'" size="x-small" variant="tonal">
                {{ stock.isActive ? 'Активна' : 'Пауза' }}
              </v-chip>
            </div>
            <v-spacer />
            <v-btn icon size="small" variant="tonal" @click="openChart(stock.symbol)">
              <v-icon>mdi-chart-areaspline</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="py-2 px-4">
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption text-grey">Цена</div>
                <div class="text-h6 font-weight-bold">${{ stock.currentPrice?.toFixed(2) || '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">В портфеле</div>
                <div class="text-body-1 font-weight-medium">{{ getHoldingQty(stock.symbol) }} шт.</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">Стоимость</div>
                <div class="text-body-1">${{ (getHoldingQty(stock.symbol) * (stock.currentPrice || 0)).toFixed(2) }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-grey">Прибыль/Убыток</div>
                <v-chip :color="pnlColor(stock.symbol)" size="small" variant="tonal" data-testid="pnl-chip-mobile">
                  {{ formatPnL(stock.symbol) }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn 
              color="success" 
              variant="tonal"
              @click="openBuyDialog(stock)"
              :disabled="!stock.isActive"
              class="flex-grow-1 mr-2"
              data-testid="buy-btn-mobile"
            >
              <v-icon start>mdi-cart-plus</v-icon>
              Купить
            </v-btn>
            <v-btn
              color="error"
              variant="tonal"
              :disabled="!stock.isActive || getHoldingQty(stock.symbol) <= 0"
              @click="openSellDialog(stock)"
              class="flex-grow-1"
              data-testid="sell-btn-mobile"
            >
              <v-icon start>mdi-cart-minus</v-icon>
              Продать
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Buy dialog -->
    <v-dialog v-model="buyDialog" max-width="450">
      <v-card class="dialog-card pa-2">
        <v-card-title class="d-flex align-center">
          <v-avatar color="success" size="40" class="mr-3">
            <v-icon color="white">mdi-cart-plus</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6">Покупка {{ selectedStock?.symbol }}</div>
            <div class="text-caption text-grey">{{ selectedStock?.company }}</div>
          </div>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="6">
              <div class="text-caption text-grey">Текущая цена</div>
              <div class="text-h5 font-weight-bold text-primary">${{ selectedStock?.currentPrice?.toFixed(2) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">Доступно</div>
              <div class="text-h5 font-weight-bold text-success">${{ brokerStore.broker?.currentBalance?.toFixed(2) }}</div>
            </v-col>
          </v-row>
          <v-alert type="info" variant="tonal" class="mt-4 rounded-xl" density="compact">
            Максимум: <strong>{{ maxBuyQty }}</strong> акций
          </v-alert>
          <v-text-field
            v-model.number="buyQty"
            label="Количество акций"
            type="number"
            min="1"
            :max="maxBuyQty"
            prepend-inner-icon="mdi-numeric"
            class="mt-4"
            data-testid="buy-quantity-input"
          />
          <div class="text-right text-body-2 mt-2">
            Итого: <strong class="text-primary">${{ (buyQty * (selectedStock?.currentPrice || 0)).toFixed(2) }}</strong>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="outlined" @click="buyDialog = false" class="flex-grow-1 mr-2">Отмена</v-btn>
          <v-btn color="success" @click="doBuy" :disabled="buyQty < 1 || buyQty > maxBuyQty" class="flex-grow-1 gradient-btn-success" data-testid="confirm-buy-btn">
            <v-icon start>mdi-check</v-icon>
            Купить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sell dialog -->
    <v-dialog v-model="sellDialog" max-width="450">
      <v-card class="dialog-card pa-2">
        <v-card-title class="d-flex align-center">
          <v-avatar color="error" size="40" class="mr-3">
            <v-icon color="white">mdi-cart-minus</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6">Продажа {{ selectedStock?.symbol }}</div>
            <div class="text-caption text-grey">{{ selectedStock?.company }}</div>
          </div>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="6">
              <div class="text-caption text-grey">Текущая цена</div>
              <div class="text-h5 font-weight-bold text-primary">${{ selectedStock?.currentPrice?.toFixed(2) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-grey">В портфеле</div>
              <div class="text-h5 font-weight-bold">{{ maxSellQty }} шт.</div>
            </v-col>
          </v-row>
          <v-text-field
            v-model.number="sellQty"
            label="Количество акций"
            type="number"
            min="1"
            :max="maxSellQty"
            prepend-inner-icon="mdi-numeric"
            class="mt-4"
            data-testid="sell-quantity-input"
          />
          <div class="text-right text-body-2 mt-2">
            Получите: <strong class="text-success">${{ (sellQty * (selectedStock?.currentPrice || 0)).toFixed(2) }}</strong>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="outlined" @click="sellDialog = false" class="flex-grow-1 mr-2">Отмена</v-btn>
          <v-btn color="error" @click="doSell" :disabled="sellQty < 1 || sellQty > maxSellQty" class="flex-grow-1" data-testid="confirm-sell-btn">
            <v-icon start>mdi-check</v-icon>
            Продать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Chart dialog -->
    <v-dialog v-model="chartDialog" max-width="800">
      <v-card class="dialog-card">
        <v-card-title class="d-flex align-center py-4">
          <v-icon color="primary" class="mr-2">mdi-chart-areaspline</v-icon>
          <span class="font-weight-bold">График {{ chartSymbol }}</span>
          <v-spacer />
          <v-btn icon variant="text" @click="chartDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <PriceChart :symbol="chartSymbol" :history="brokerStore.priceHistory[chartSymbol] || []" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBrokerStore } from '@/stores/broker'
import PriceChart from '@/components/PriceChart.vue'

const brokerStore = useBrokerStore()

const buyDialog = ref(false)
const sellDialog = ref(false)
const chartDialog = ref(false)
const selectedStock = ref(null)
const chartSymbol = ref('')
const buyQty = ref(1)
const sellQty = ref(1)

onMounted(() => {
  if (brokerStore.broker) {
    brokerStore.fetchStocks()
    brokerStore.connectSocket()
  }
})

// Helper to get holding quantity (holdings can be {quantity, avgBuyPrice} or just a number)
function getHoldingQty(symbol) {
  if (!brokerStore.broker?.holdings) return 0
  const h = brokerStore.broker.holdings[symbol]
  if (!h) return 0
  return typeof h === 'object' ? h.quantity : h
}

const maxBuyQty = computed(() => {
  if (!selectedStock.value || !brokerStore.broker) return 0
  const price = selectedStock.value.currentPrice || 1
  return Math.floor((brokerStore.broker.currentBalance || 0) / price)
})

const maxSellQty = computed(() => {
  if (!selectedStock.value || !brokerStore.broker) return 0
  return getHoldingQty(selectedStock.value.symbol)
})

function openBuyDialog(stock) {
  selectedStock.value = stock
  buyQty.value = 1
  buyDialog.value = true
}

function openSellDialog(stock) {
  selectedStock.value = stock
  sellQty.value = 1
  sellDialog.value = true
}

function openChart(symbol) {
  chartSymbol.value = symbol
  chartDialog.value = true
}

async function doBuy() {
  if (!selectedStock.value || !buyQty.value || buyQty.value < 1) return
  try {
    await brokerStore.buyStock(selectedStock.value.symbol, Number(buyQty.value))
    buyDialog.value = false
  } catch (e) {
    console.error('Buy error:', e)
    alert('Ошибка покупки: ' + (e.response?.data?.message || e.message))
  }
}

async function doSell() {
  if (!selectedStock.value || !sellQty.value || sellQty.value < 1) return
  try {
    await brokerStore.sellStock(selectedStock.value.symbol, Number(sellQty.value))
    sellDialog.value = false
  } catch (e) {
    console.error('Sell error:', e)
    alert('Ошибка продажи: ' + (e.response?.data?.message || e.message))
  }
}

function formatPnL(symbol) {
  const pnl = brokerStore.getPnL(symbol)
  if (pnl === 0) return '$0.00'
  return (pnl > 0 ? '+' : '') + '$' + pnl.toFixed(2)
}

function pnlColor(symbol) {
  const pnl = brokerStore.getPnL(symbol)
  if (pnl > 0) return 'success'
  if (pnl < 0) return 'error'
  return 'grey'
}
</script>

<style scoped>
.trading-view {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  position: relative;
  overflow: hidden;
  padding: 20px;
  background: white !important;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.stat-card-date::before {
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
}

.stat-card-cash::before {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.stat-card-total::before {
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
}

.stat-card-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0.1;
}

.stat-card-date .stat-card-icon { color: #3b82f6; }
.stat-card-cash .stat-card-icon { color: #10b981; }
.stat-card-total .stat-card-icon { color: #7c3aed; }

.stat-label {
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  color: #6b7280 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 !important;
}

.stat-value {
  font-size: 1.75rem !important;
  font-weight: 700 !important;
  color: #1f2937 !important;
  padding: 8px 0 0 0 !important;
}

.stocks-card {
  background: white !important;
}

.stocks-table thead {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%) !important;
}

.stocks-table thead th {
  font-weight: 600 !important;
  color: #6b7280 !important;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.5px;
}

.stocks-table tbody tr {
  transition: all 0.2s ease;
}

.stocks-table tbody tr:hover {
  background: rgba(124, 58, 237, 0.03) !important;
}

.inactive-row {
  opacity: 0.6;
  background: #f9fafb !important;
}

.stock-card-mobile {
  transition: all 0.3s ease;
  background: white !important;
}

.stock-card-mobile:hover {
  transform: translateY(-4px);
}

.stock-card-inactive {
  opacity: 0.7;
  background: #f9fafb !important;
}

.dialog-card {
  border-radius: 24px !important;
}

.glassmorphic-alert {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px) !important;
}

.gradient-btn-success {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%) !important;
  color: white !important;
}
</style>

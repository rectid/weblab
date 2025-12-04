<template>
  <div class="admin-view">
    <!-- Login dialog -->
    <v-dialog v-model="showLogin" persistent max-width="450">
      <v-card class="login-dialog-card pa-4">
        <v-card-title class="d-flex align-center justify-center pb-4">
          <v-avatar color="primary" size="56" class="mr-3">
            <v-icon size="32" color="white">mdi-shield-lock-outline</v-icon>
          </v-avatar>
        </v-card-title>
        <v-card-subtitle class="text-center text-h6 pb-4">
          Вход в панель управления
        </v-card-subtitle>
        <v-card-text>
          <v-text-field
            v-model="password"
            label="Пароль администратора"
            type="password"
            prepend-inner-icon="mdi-key-variant"
            @keyup.enter="doLogin"
            :error-messages="loginError"
            variant="outlined"
            class="mb-2"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-btn to="/" variant="outlined" class="flex-grow-1 mr-2">
            <v-icon start>mdi-arrow-left</v-icon>
            Назад
          </v-btn>
          <v-btn color="primary" @click="doLogin" class="flex-grow-1 gradient-btn">
            <v-icon start>mdi-login-variant</v-icon>
            Войти
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <template v-if="isAuthenticated">
      <v-row>
        <v-col cols="12">
          <v-card class="admin-header-card">
            <v-card-title class="d-flex align-center py-4">
              <v-avatar color="primary" size="48" class="mr-4">
                <v-icon size="28" color="white">mdi-shield-crown</v-icon>
              </v-avatar>
              <div>
                <div class="text-h5 font-weight-bold">Панель администратора</div>
                <div class="text-caption text-grey">Мониторинг всех брокеров и портфелей</div>
              </div>
              <v-spacer />
              <v-btn color="error" variant="tonal" @click="doLogout" class="d-none d-sm-flex">
                <v-icon start>mdi-logout-variant</v-icon>
                Выйти
              </v-btn>
              <v-btn color="error" variant="tonal" icon @click="doLogout" class="d-flex d-sm-none">
                <v-icon>mdi-logout-variant</v-icon>
              </v-btn>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-mini-card">
            <v-card-text class="d-flex align-center">
              <v-avatar color="primary" size="48" class="mr-3">
                <v-icon color="white">mdi-calendar-clock</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-grey">Текущая дата</div>
                <div class="text-h6 font-weight-bold">{{ brokerStore.currentDate || '—' }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-mini-card">
            <v-card-text class="d-flex align-center">
              <v-avatar color="secondary" size="48" class="mr-3">
                <v-icon color="white">mdi-account-group</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-grey">Брокеров</div>
                <div class="text-h6 font-weight-bold">{{ brokerStore.allBrokers.length }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-mini-card">
            <v-card-text class="d-flex align-center">
              <v-avatar color="success" size="48" class="mr-3">
                <v-icon color="white">mdi-chart-line</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-grey">Акций торгуется</div>
                <div class="text-h6 font-weight-bold">{{ brokerStore.stocks.filter(s => s.isActive).length }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-mini-card clickable" @click="refresh">
            <v-card-text class="d-flex align-center">
              <v-avatar color="warning" size="48" class="mr-3">
                <v-icon color="white">mdi-refresh</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-grey">Обновить</div>
                <div class="text-body-2 font-weight-medium">Нажмите для обновления</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-card class="brokers-table-card">
            <v-card-title class="d-flex align-center py-4">
              <v-icon color="primary" class="mr-2">mdi-table-account</v-icon>
              <span class="font-weight-bold">Обзор брокеров</span>
            </v-card-title>

            <v-table v-if="brokerStore.allBrokers.length" density="comfortable" class="brokers-table">
              <thead>
                <tr>
                  <th class="text-left">Брокер</th>
                  <th class="text-right">Начальный</th>
                  <th class="text-right">Свободно</th>
                  <th class="text-right">Портфель</th>
                  <th class="text-right">Всего</th>
                  <th class="text-right">P/L</th>
                  <th class="text-left">Позиции</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in brokerStore.allBrokers" :key="b.id">
                  <td>
                    <div class="d-flex align-center">
                      <v-avatar color="primary" size="32" class="mr-2">
                        <span class="text-white text-caption font-weight-bold">{{ b.name?.charAt(0).toUpperCase() }}</span>
                      </v-avatar>
                      <strong>{{ b.name }}</strong>
                    </div>
                  </td>
                  <td class="text-right">${{ b.initialBalance?.toFixed(2) || '0.00' }}</td>
                  <td class="text-right font-weight-medium">${{ b.currentBalance?.toFixed(2) || '0.00' }}</td>
                  <td class="text-right">${{ calcPortfolio(b).toFixed(2) }}</td>
                  <td class="text-right font-weight-bold">${{ ((b.currentBalance || 0) + calcPortfolio(b)).toFixed(2) }}</td>
                  <td class="text-right">
                    <v-chip :color="totalPnLColor(b)" variant="tonal" size="small">
                      {{ formatTotalPnL(b) }}
                    </v-chip>
                  </td>
                  <td>
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="(holding, sym) in b.holdings"
                        :key="sym"
                        size="small"
                        :color="getPnLColor(b, sym)"
                        variant="tonal"
                      >
                        {{ sym }}: {{ getQty(holding) }}
                        <span class="ml-1 text-caption">({{ formatPnL(b, sym) }})</span>
                      </v-chip>
                      <span v-if="!b.holdings || Object.keys(b.holdings).length === 0" class="text-grey text-caption">
                        Нет позиций
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-card-text v-else>
              <v-alert type="info" variant="tonal" class="rounded-xl">
                <v-icon start>mdi-information-outline</v-icon>
                Нет зарегистрированных брокеров
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12">
          <v-btn to="/" variant="outlined" size="large">
            <v-icon start>mdi-arrow-left</v-icon>
            Вернуться на главную
          </v-btn>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBrokerStore } from '@/stores/broker'

const ADMIN_PASSWORD = 'admin123'

const brokerStore = useBrokerStore()
const showLogin = ref(true)
const isAuthenticated = ref(false)
const password = ref('')
const loginError = ref('')

onMounted(() => {
  // Check if already authenticated in session
  if (sessionStorage.getItem('adminAuth') === 'true') {
    isAuthenticated.value = true
    showLogin.value = false
    loadData()
  }
})

function doLogin() {
  if (password.value === ADMIN_PASSWORD) {
    isAuthenticated.value = true
    showLogin.value = false
    sessionStorage.setItem('adminAuth', 'true')
    loginError.value = ''
    loadData()
  } else {
    loginError.value = 'Неверный пароль'
  }
}

function doLogout() {
  isAuthenticated.value = false
  showLogin.value = true
  sessionStorage.removeItem('adminAuth')
  password.value = ''
}

function loadData() {
  brokerStore.connectSocket()
  brokerStore.fetchStocks()
  brokerStore.fetchAllBrokers()
}

function refresh() {
  brokerStore.fetchAllBrokers()
  brokerStore.fetchStocks()
}

function getQty(holding) {
  if (!holding) return 0
  return typeof holding === 'object' ? holding.quantity : holding
}

function getAvgPrice(holding) {
  if (!holding) return 0
  return typeof holding === 'object' ? holding.avgBuyPrice : 0
}

function calcPortfolio(b) {
  return Object.entries(b.holdings || {}).reduce((sum, [sym, holding]) => {
    const qty = getQty(holding)
    const stock = brokerStore.stocks.find(s => s.symbol === sym)
    return sum + qty * (stock?.currentPrice || 0)
  }, 0)
}

function getPnL(b, sym) {
  const holding = b.holdings?.[sym]
  if (!holding) return 0
  const qty = getQty(holding)
  const avgCost = getAvgPrice(holding)
  const stock = brokerStore.stocks.find(s => s.symbol === sym)
  const price = stock?.currentPrice || 0
  return (price - avgCost) * qty
}

function formatPnL(b, sym) {
  const pnl = getPnL(b, sym)
  if (pnl === 0) return '$0'
  return (pnl > 0 ? '+' : '') + '$' + pnl.toFixed(0)
}

function getPnLColor(b, sym) {
  const pnl = getPnL(b, sym)
  if (pnl > 0) return 'success'
  if (pnl < 0) return 'error'
  return 'grey'
}

function getTotalPnL(b) {
  const total = (b.currentBalance || 0) + calcPortfolio(b)
  return total - (b.initialBalance || 0)
}

function formatTotalPnL(b) {
  const pnl = getTotalPnL(b)
  if (pnl === 0) return '$0.00'
  return (pnl > 0 ? '+' : '') + '$' + pnl.toFixed(2)
}

function totalPnLColor(b) {
  const pnl = getTotalPnL(b)
  if (pnl > 0) return 'success'
  if (pnl < 0) return 'error'
  return 'grey'
}
</script>

<style scoped>
.admin-view {
  max-width: 1400px;
  margin: 0 auto;
}

.login-dialog-card {
  border-radius: 24px !important;
}

.admin-header-card {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%) !important;
}

.stat-mini-card {
  transition: all 0.3s ease;
}

.stat-mini-card.clickable {
  cursor: pointer;
}

.stat-mini-card.clickable:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.2) !important;
}

.brokers-table-card {
  background: white !important;
}

.brokers-table thead {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%) !important;
}

.brokers-table thead th {
  font-weight: 600 !important;
  color: #6b7280 !important;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.5px;
}

.brokers-table tbody tr {
  transition: all 0.2s ease;
}

.brokers-table tbody tr:hover {
  background: rgba(124, 58, 237, 0.03) !important;
}

.gradient-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%) !important;
  color: white !important;
}

.gap-1 {
  gap: 4px;
}
</style>

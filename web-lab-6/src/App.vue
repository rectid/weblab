<template>
  <v-app class="gradient-bg">
    <v-app-bar color="transparent" flat class="glassmorphic-bar">
      <!-- Mobile menu -->
      <v-app-bar-nav-icon class="d-flex d-sm-none gradient-icon" @click="drawer = !drawer" />
      
      <v-app-bar-title class="app-title">
        <v-icon class="mr-2 gradient-icon">mdi-finance</v-icon>
        <span class="gradient-text">StockFlow</span>
      </v-app-bar-title>
      <v-spacer />
      
      <!-- Desktop: show chips and buttons -->
      <template v-if="brokerStore.broker">
        <v-chip class="mr-2 d-none d-sm-flex glassmorphic-chip" variant="flat">
          <v-icon start size="small" color="primary">mdi-account-circle</v-icon>
          {{ brokerStore.broker.name }}
        </v-chip>
        <v-chip class="mr-2 d-none d-md-flex glassmorphic-chip balance-chip" variant="flat">
          <v-icon start size="small" color="success">mdi-wallet</v-icon>
          ${{ brokerStore.broker.currentBalance?.toFixed(2) }}
        </v-chip>
        <v-btn class="gradient-btn-outline d-none d-sm-flex" variant="outlined" @click="logout">
          <v-icon start>mdi-logout-variant</v-icon>
          <span class="d-none d-md-inline">Выход</span>
        </v-btn>
      </template>
      <v-btn v-if="!brokerStore.broker" to="/admin" class="gradient-btn d-none d-sm-flex">
        <v-icon start>mdi-shield-crown-outline</v-icon>
        <span class="d-none d-md-inline">Админ</span>
      </v-btn>
    </v-app-bar>

    <!-- Mobile navigation drawer -->
    <v-navigation-drawer v-model="drawer" temporary class="glassmorphic-drawer">
      <div class="drawer-header pa-4">
        <v-icon size="32" class="gradient-icon">mdi-finance</v-icon>
        <span class="gradient-text text-h6 ml-2">StockFlow</span>
      </div>
      <v-divider />
      <v-list class="pa-2">
        <template v-if="brokerStore.broker">
          <v-list-item class="rounded-xl mb-2 user-info-item">
            <v-list-item-title class="text-h6 font-weight-bold">{{ brokerStore.broker.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-success font-weight-medium">${{ brokerStore.broker.currentBalance?.toFixed(2) }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item to="/trading" @click="drawer = false" class="rounded-xl nav-item">
            <template v-slot:prepend><v-icon color="primary">mdi-chart-timeline-variant-shimmer</v-icon></template>
            <v-list-item-title>Торговля</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout(); drawer = false" class="rounded-xl nav-item">
            <template v-slot:prepend><v-icon color="error">mdi-logout-variant</v-icon></template>
            <v-list-item-title>Выход</v-list-item-title>
          </v-list-item>
        </template>
        <template v-else>
          <v-list-item to="/" @click="drawer = false" class="rounded-xl nav-item">
            <template v-slot:prepend><v-icon color="primary">mdi-login-variant</v-icon></template>
            <v-list-item-title>Вход</v-list-item-title>
          </v-list-item>
          <v-list-item to="/admin" @click="drawer = false" class="rounded-xl nav-item">
            <template v-slot:prepend><v-icon color="secondary">mdi-shield-crown-outline</v-icon></template>
            <v-list-item-title>Админ</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-4 pa-sm-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useBrokerStore } from '@/stores/broker'
import { useRouter } from 'vue-router'

const brokerStore = useBrokerStore()
const router = useRouter()
const drawer = ref(false)

function logout() {
  brokerStore.logout()
  router.push('/')
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');

.v-application {
  font-family: 'Inter', sans-serif !important;
}

.gradient-bg {
  background: linear-gradient(135deg, #f5f7ff 0%, #e8f4fc 50%, #fdf2f8 100%) !important;
  min-height: 100vh;
}

.glassmorphic-bar {
  backdrop-filter: blur(20px) !important;
  background: rgba(255, 255, 255, 0.7) !important;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1) !important;
}

.glassmorphic-drawer {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px) !important;
}

.glassmorphic-chip {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(124, 58, 237, 0.2) !important;
}

.balance-chip {
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
}

.app-title {
  font-family: 'Poppins', sans-serif !important;
  font-weight: 600 !important;
}

.gradient-text {
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.gradient-icon {
  color: #7c3aed !important;
}

.gradient-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%) !important;
  color: white !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}

.gradient-btn-outline {
  border: 2px solid #7c3aed !important;
  color: #7c3aed !important;
  font-weight: 600 !important;
  text-transform: none !important;
}

.gradient-btn-outline:hover {
  background: rgba(124, 58, 237, 0.1) !important;
}

.drawer-header {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
  display: flex;
  align-items: center;
}

.user-info-item {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
}

.nav-item {
  transition: all 0.3s ease !important;
}

.nav-item:hover {
  background: rgba(124, 58, 237, 0.1) !important;
  transform: translateX(4px);
}

/* Global card styles */
.v-card {
  border: 1px solid rgba(124, 58, 237, 0.1) !important;
  box-shadow: 0 4px 24px rgba(124, 58, 237, 0.08) !important;
  transition: all 0.3s ease !important;
}

.v-card:hover {
  box-shadow: 0 8px 32px rgba(124, 58, 237, 0.15) !important;
  transform: translateY(-2px);
}

/* Button global styles */
.v-btn--variant-elevated, .v-btn--variant-flat {
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
}

/* Table styles */
.v-table {
  border-radius: 16px !important;
  overflow: hidden !important;
}

.v-table thead {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%) !important;
}

.v-table tbody tr:hover {
  background: rgba(124, 58, 237, 0.05) !important;
}

/* Input field styles */
.v-field--variant-outlined .v-field__outline__start,
.v-field--variant-outlined .v-field__outline__end {
  border-color: rgba(124, 58, 237, 0.3) !important;
}

.v-field--focused .v-field__outline__start,
.v-field--focused .v-field__outline__end {
  border-color: #7c3aed !important;
}

/* Chip styles */
.v-chip {
  font-weight: 500 !important;
}

/* Alert styles */
.v-alert {
  border-radius: 16px !important;
}

/* Dialog styles */
.v-dialog .v-card {
  border-radius: 24px !important;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(124, 58, 237, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #6d28d9 0%, #0891b2 100%);
}
</style>

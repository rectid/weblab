<template>
  <v-container class="fill-height login-container">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <div class="text-center mb-8">
          <v-icon size="64" class="gradient-icon-large mb-4">mdi-finance</v-icon>
          <h1 class="text-h4 font-weight-bold gradient-text-large">StockFlow</h1>
          <p class="text-body-2 text-grey mt-2">Платформа для торговли акциями</p>
        </div>
        
        <v-card class="login-card pa-6 pa-sm-8">
          <v-card-title class="text-h5 font-weight-bold text-center pb-2">
            <v-icon start color="primary" size="28">mdi-account-circle-outline</v-icon>
            Добро пожаловать
          </v-card-title>
          <v-card-subtitle class="text-center pb-6">
            Выберите аккаунт брокера для входа
          </v-card-subtitle>
          
          <v-card-text>
            <v-form @submit.prevent="doLogin">
              <v-select
                v-model="selectedBroker"
                :items="existingBrokers"
                item-title="name"
                item-value="id"
                label="Выберите брокера"
                prepend-inner-icon="mdi-account-tie"
                :loading="loadingBrokers"
                :rules="[v => !!v || 'Выберите брокера']"
                return-object
                class="mb-4"
                bg-color="white"
                data-testid="broker-select"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" class="py-3">
                    <template v-slot:prepend>
                      <v-avatar color="primary" size="36">
                        <span class="text-white font-weight-bold">{{ item.raw.name?.charAt(0).toUpperCase() }}</span>
                      </v-avatar>
                    </template>
                    <template v-slot:append>
                      <v-chip color="success" size="small" variant="tonal">
                        ${{ item.raw.currentBalance?.toFixed(0) || '0' }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-form>
            
            <v-expand-transition>
              <v-alert v-if="error" type="error" variant="tonal" class="mt-4 rounded-xl">
                <v-icon start>mdi-alert-circle-outline</v-icon>
                {{ error }}
              </v-alert>
            </v-expand-transition>
          </v-card-text>
          
          <v-card-actions class="px-4 pb-2">
            <v-btn 
              class="gradient-btn flex-grow-1" 
              size="large" 
              @click="doLogin" 
              :loading="loading" 
              :disabled="!selectedBroker"
              data-testid="login-btn"
            >
              <v-icon start>mdi-login-variant</v-icon>
              Войти в систему
            </v-btn>
          </v-card-actions>
          
          <div class="text-center mt-4">
            <v-btn to="/admin" variant="text" color="secondary" size="small">
              <v-icon start size="small">mdi-shield-crown-outline</v-icon>
              Панель администратора
            </v-btn>
          </div>
        </v-card>
        
        <div class="text-center mt-6">
          <v-chip variant="outlined" size="small" color="grey">
            <v-icon start size="small">mdi-information-outline</v-icon>
            Версия 2.0 • Современная торговля
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBrokerStore } from '@/stores/broker'
import { useRouter } from 'vue-router'
import axios from 'axios'

const selectedBroker = ref(null)
const loading = ref(false)
const loadingBrokers = ref(true)
const existingBrokers = ref([])
const error = ref('')

const brokerStore = useBrokerStore()
const router = useRouter()

onMounted(async () => {
  await loadBrokers()
})

async function loadBrokers() {
  loadingBrokers.value = true
  error.value = ''
  try {
    const res = await axios.get('/api/brokers')
    existingBrokers.value = res.data
    if (existingBrokers.value.length === 0) {
      error.value = 'Нет доступных брокеров. Создайте брокера в админ-панели React приложения (порт 5173)'
    }
  } catch (e) {
    console.error(e)
    error.value = 'Ошибка загрузки списка брокеров'
  } finally {
    loadingBrokers.value = false
  }
}

async function doLogin() {
  if (!selectedBroker.value) return
  loading.value = true
  error.value = ''
  try {
    await brokerStore.loginById(selectedBroker.value.id)
    router.push('/trading')
  } catch (e) {
    console.error(e)
    error.value = 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  background: transparent;
}

.login-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
}

.gradient-icon-large {
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-large {
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%) !important;
  color: white !important;
  font-weight: 600 !important;
  text-transform: none !important;
}
</style>

import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import TradingView from '@/views/TradingView.vue'
import AdminView from '@/views/AdminView.vue'

const routes = [
  { path: '/', name: 'Login', component: LoginView },
  { path: '/trading', name: 'Trading', component: TradingView },
  { path: '/admin', name: 'Admin', component: AdminView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

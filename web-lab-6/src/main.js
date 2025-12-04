import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Soft pastel gradient theme
const softGradientTheme = {
  dark: false,
  colors: {
    background: '#fafbff',
    surface: '#ffffff',
    'surface-variant': '#f8f9fe',
    primary: '#7c3aed',
    'primary-darken-1': '#6d28d9',
    secondary: '#06b6d4',
    'secondary-darken-1': '#0891b2',
    error: '#ef4444',
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
  },
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'softGradientTheme',
    themes: {
      softGradientTheme,
    },
  },
  defaults: {
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VBtn: {
      rounded: 'xl',
    },
    VTextField: {
      rounded: 'xl',
      variant: 'outlined',
    },
    VSelect: {
      rounded: 'xl',
      variant: 'outlined',
    },
  },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')

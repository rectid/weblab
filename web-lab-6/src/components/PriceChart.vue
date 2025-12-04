<template>
  <div class="chart-container">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
    <div v-else class="no-data">
      <v-icon size="48" color="grey">mdi-chart-line-variant</v-icon>
      <p class="text-grey mt-2">Нет данных для графика</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps({
  symbol: String,
  history: Array
})

const chartData = computed(() => {
  if (!props.history || props.history.length === 0) return null
  
  const sorted = [...props.history]
  
  return {
    labels: sorted.map(h => h.date),
    datasets: [
      {
        label: props.symbol,
        data: sorted.map(h => h.price),
        borderColor: '#7c3aed',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(124, 58, 237, 0.3)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#06b6d4',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: { 
      display: false 
    },
    title: { 
      display: true, 
      text: `График ${props.symbol}`,
      font: {
        family: "'Poppins', sans-serif",
        size: 16,
        weight: '600'
      },
      color: '#374151',
      padding: {
        bottom: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#7c3aed',
      bodyColor: '#374151',
      borderColor: 'rgba(124, 58, 237, 0.2)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      titleFont: {
        family: "'Poppins', sans-serif",
        weight: '600',
        size: 13
      },
      bodyFont: {
        family: "'Inter', sans-serif",
        size: 12
      },
      displayColors: false,
      callbacks: {
        label: (context) => `Цена: $${context.parsed.y.toFixed(2)}`
      }
    }
  },
  scales: {
    x: { 
      title: { 
        display: true, 
        text: 'Дата',
        color: '#6b7280',
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: '500'
        }
      },
      grid: {
        color: 'rgba(124, 58, 237, 0.08)',
      },
      ticks: {
        color: '#6b7280',
        font: {
          family: "'Inter', sans-serif",
          size: 11
        }
      }
    },
    y: { 
      title: { 
        display: true, 
        text: 'Цена ($)',
        color: '#6b7280',
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: '500'
        }
      },
      grid: {
        color: 'rgba(124, 58, 237, 0.08)',
      },
      ticks: {
        color: '#6b7280',
        font: {
          family: "'Inter', sans-serif",
          size: 11
        },
        callback: (value) => '$' + value.toFixed(0)
      }
    }
  }
}
</script>

<style scoped>
.chart-container {
  height: 350px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%);
  border-radius: 16px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>

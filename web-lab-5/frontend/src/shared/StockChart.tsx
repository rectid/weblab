import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler)

type PricePoint = { date: string; open: number }
export default function StockChart({ data }: { data: PricePoint[] }){
  const labels = data.map(d=>d.date)
  const dataset = data.map(d=>d.open)
  
  const chartData = { 
    labels, 
    datasets: [{ 
      label: 'Price', 
      data: dataset, 
      borderColor: '#00fff7',
      backgroundColor: 'rgba(0, 255, 247, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#ff00ff',
      pointBorderColor: '#ff00ff',
      pointRadius: 3,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#00fff7',
      pointHoverBorderColor: '#00fff7',
    }] 
  }
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#00fff7',
          font: {
            family: 'Orbitron',
            size: 12,
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 37, 0.95)',
        titleColor: '#00fff7',
        bodyColor: '#e0e0e0',
        borderColor: '#00fff7',
        borderWidth: 1,
        titleFont: {
          family: 'Orbitron',
        },
        bodyFont: {
          family: 'Rajdhani',
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 255, 247, 0.1)',
        },
        ticks: {
          color: '#00fff7',
          font: {
            family: 'Rajdhani',
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 0, 255, 0.1)',
        },
        ticks: {
          color: '#ff00ff',
          font: {
            family: 'Rajdhani',
          }
        }
      }
    }
  }
  
  return <Line data={chartData} options={options} />
}

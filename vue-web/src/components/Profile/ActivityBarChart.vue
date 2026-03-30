<template>
  <div class="trend-chart-container">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
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
} from 'chart.js';
import { Line } from 'vue-chartjs';

// Регистрируем компоненты Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Определяем входящие данные (props), которые придут из API
const props = defineProps({
  labels: { 
    type: Array, 
    default: () => [] 
  },
  tasksTrend: { 
    type: Array, 
    default: () => [] 
  },
  matchesTrend: { 
    type: Array, 
    default: () => [] 
  }
});

// Формируем данные для графика. 
// Используем computed, чтобы график перерисовывался при получении новых данных с бэка.
const chartData = computed(() => {
  return {
    labels: props.labels,
    datasets: [
      {
        label: 'Tasks Completed',
        data: props.tasksTrend,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Matches Played',
        data: props.matchesTrend,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#3b82f6',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }
    ]
  };
});

// Настройки внешнего вида графика (оставляем без изменений)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 15,
        font: { size: 12, weight: '600', family: "'Segoe UI', sans-serif" },
        color: '#475569'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: { size: 13, family: "'Segoe UI', sans-serif" },
      bodyFont: { size: 13, weight: 'bold', family: "'Segoe UI', sans-serif" },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true
    },
    datalabels: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { weight: '500' } }
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: {
        color: '#f1f5f9',
        drawTicks: false,
      },
      ticks: {
        color: '#94a3b8',
        stepSize: 1, // Шаг оси Y. Если задач в месяц будет много (например 50-100), эту строчку можно удалить для автомасштабирования
        padding: 10
      }
    }
  }
};
</script>

<style scoped>
.trend-chart-container {
  width: 100%;
  height: 100%;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
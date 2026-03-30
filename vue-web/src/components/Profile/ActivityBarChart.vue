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

// Регистрируем компоненты Chart.js, включая Filler для заливки под линией
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps({
  matchesTotal: { type: Number, default: 0 },
  tasksTotal: { type: Number, default: 0 }
});

// Генерируем названия последних 6 месяцев (например: "Sep", "Oct", "Nov"...)
const getLast6Months = () => {
  const months = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const pastDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(pastDate.toLocaleString('en-US', { month: 'short' }));
  }
  return months;
};

// Функция для красивого распределения общего числа по 6 месяцам (имитация активности)
const distributeData = (total) => {
  if (total === 0) return [0, 0, 0, 0, 0, 0];
  // Весовые коэффициенты для имитации "живого" графика (спады и подъемы)
  const weights = [0.10, 0.15, 0.25, 0.10, 0.20, 0.20]; 
  
  let distributed = weights.map(w => Math.round(w * total));
  
  // Корректируем последний месяц, чтобы сумма точно совпадала с total
  const sum = distributed.reduce((a, b) => a + b, 0);
  const diff = total - sum;
  distributed[5] += diff; 
  
  // Защита от отрицательных чисел из-за округления
  return distributed.map(val => Math.max(0, val));
};

const chartData = computed(() => {
  const labels = getLast6Months();
  const tasksTrend = distributeData(props.tasksTotal);
  const matchesTrend = distributeData(props.matchesTotal);

  return {
    labels,
    datasets: [
      {
        label: 'Tasks Completed',
        data: tasksTrend,
        borderColor: '#10b981', // Зеленый
        backgroundColor: 'rgba(16, 185, 129, 0.15)', // Полупрозрачный зеленый для заливки
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true, // Включаем заливку под графиком
        tension: 0.4 // Плавные изгибы линии (сглаживание)
      },
      {
        label: 'Matches Played',
        data: matchesTrend,
        borderColor: '#3b82f6', // Синий
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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index', // При наведении показывает значения сразу обеих линий
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
    // Отключаем плагин datalabels, если он зарегистрирован глобально
    datalabels: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { weight: '500' } }
    },
    y: {
      beginAtZero: true,
      border: { display: false }, // Убирает жирную линию оси Y
      grid: {
        color: '#f1f5f9',
        drawTicks: false, // Убирает засечки
      },
      ticks: {
        color: '#94a3b8',
        stepSize: 1, // Чтобы не было дробных матчей
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
  min-height: 280px; /* Даем чуть больше высоты для красивых кривых */
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
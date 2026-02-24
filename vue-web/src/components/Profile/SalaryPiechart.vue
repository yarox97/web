<template>
  <div class="chart-wrapper">
    <div class="month-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      {{ currentMonthName }}
    </div>

    <div v-if="isLoading" class="loading-box">
      <Spinner />
    </div>
    
    <div v-else-if="currentMonthPayslips.length === 0" class="empty-state">
      <p>No financial data available for {{ currentMonthName }} yet.</p>
    </div>

    <div v-else class="pie-container">
      <Pie :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Pie } from 'vue-chartjs';
import ChartDataLabels from 'chartjs-plugin-datalabels'; 
import payslipsService from '@/modules/payslips/services/payslipService';
import Spinner from '@/components/shared/Spinner.vue';

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const payslips = ref([]);
const isLoading = ref(true);

const backgroundColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#f43f5e', '#84cc16', '#d946ef', '#14b8a6'
];

// --- ЛОГИКА ТЕКУЩЕГО МЕСЯЦА ---
const now = new Date();
const currentMonthNum = now.getMonth() + 1; // Месяцы в JS идут от 0 до 11, поэтому +1
const currentYearNum = now.getFullYear();

// Форматируем название месяца (например: "February 2026")
const currentMonthName = computed(() => {
  return now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
});

// Фильтруем ТОЛЬКО пейслипы текущего месяца и года
const currentMonthPayslips = computed(() => {
  return payslips.value.filter(slip => 
    slip.month === currentMonthNum && slip.year === currentYearNum
  );
});

// --- ДАННЫЕ ДЛЯ ГРАФИКА ---
const chartData = computed(() => {
  // Используем отфильтрованные данные текущего месяца
  const incomeByClub = currentMonthPayslips.value.reduce((acc, slip) => {
    const club = slip.clubName || 'Other';
    acc[club] = (acc[club] || 0) + (slip.totalAmount || 0);
    return acc;
  }, {});

  const labels = Object.keys(incomeByClub);

  return {
    labels: labels,
    datasets: [
      {
        data: Object.values(incomeByClub),
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 10
      }
    ]
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: window.innerWidth < 450 ? 'bottom' : 'right',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { size: 12, weight: '500' }
      }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      callbacks: {
        label: (context) => {
          const value = context.parsed;
          const formatted = new Intl.NumberFormat('en-US', { 
            style: 'currency', currency: 'USD', maximumFractionDigits: 0 
          }).format(value);
          return ` Total Income: ${formatted}`;
        }
      }
    },
    datalabels: {
      color: '#ffffff', 
      font: {
        weight: 'bold',
        size: 13
      },
      formatter: (value) => {
        if (value === 0) return ''; 
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD', 
          maximumFractionDigits: 0 
        }).format(value);
      }
    }
  }
}));

const fetchPayslips = async () => {
  try {
    // Получаем список всех пейслипов юзера (100 штук хватит с запасом)
    const response = await payslipsService.getMyPayslips(1, 100); 
    const data = response.data?.value || response.data;
    payslips.value = data.items || [];
  } catch (error) {
    console.error("Chart error:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchPayslips);
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.month-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  align-self: flex-start;
  margin-bottom: 15px;
  /* Если в родительском ProfileView.vue заголовок слева, бейджик красиво встанет под ним */
}

.pie-container {
  flex: 1;
  width: 100%;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-box, .empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.95rem;
  text-align: center;
  font-style: italic;
  min-height: 250px;
}
</style>
<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api'; 
import { formatDate } from '@/utils/dateFormater'; // Убедитесь, что путь верный

// --- STATE ---
const contracts = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Пагинация
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const totalPages = ref(0);

// --- HELPERS ---

// Форматтер валюты. 
// Если Currency приходит как Enum (int), мапим его на символы.
const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined) return 'N/A';
  
  let symbol = '';
  // Пример маппинга Enum Currency (0=USD, 1=EUR, 2=PLN и т.д.)
  // Настройте под ваш Enum в C#
  switch (currency) {
    case 0: symbol = '$'; break;     // USD
    case 1: symbol = '€'; break;     // EUR
    case 2: symbol = 'zł'; break;    // PLN
    default: symbol = ''; 
  }

  // Форматируем число (например: 1,000)
  return `${symbol} ${amount.toLocaleString()}`;
};

const getStatusClass = (isActive, endDate) => {
  if (isActive) return 'status-active';
  if (new Date(endDate) < new Date()) return 'status-expired';
  return 'status-inactive';
};

const getStatusLabel = (isActive, endDate) => {
  if (isActive) return 'Active';
  if (new Date(endDate) < new Date()) return 'Expired';
  return 'Inactive';
};

// --- API ---

const fetchContracts = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // Используем эндпоинт из вашего контроллера: [HttpGet("user/my-contracts")]
    const response = await api.get('/api/contracts/user/my-contracts', {
      params: {
        pageNumber: currentPage.value,
        pageSize: pageSize.value
      }
    });

    if (response.data) {
        // Если бэкенд возвращает Result<PaginatedResult>, данные могут быть вложены
        // Проверьте структуру JSON. Обычно это response.data или response.data.items
        const result = response.data; 

        contracts.value = result.items || [];
        totalCount.value = result.totalCount || 0;
        
        // Расчет страниц, если бэкенд не вернул totalPages явно
        totalPages.value = result.totalPages || Math.ceil(totalCount.value / pageSize.value);
    }
  } catch (err) {
    console.error("Error fetching contracts:", err);
    error.value = "Unable to load contracts. Please try again later.";
  } finally {
    isLoading.value = false;
  }
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  currentPage.value = newPage;
  // Скролл вверх при смене страницы
  window.scrollTo({ top: 0, behavior: 'smooth' });
  fetchContracts();
};

// --- LIFECYCLE ---
onMounted(() => {
  fetchContracts();
});
</script>

<template>
  <div class="page-container">
    <div class="content-wrapper">
      
      <div class="page-header">
        <h1 class="page-title">My Contracts</h1>
        <p class="page-subtitle">History of your professional agreements</p>
      </div>

      <div v-if="isLoading" class="state-box">
        <div class="spinner"></div>
        <p>Loading contracts...</p>
      </div>

      <div v-else-if="error" class="state-box error">
        <p>{{ error }}</p>
        <button @click="fetchContracts" class="btn-retry">Try Again</button>
      </div>

      <div v-else-if="contracts.length === 0" class="state-box empty">
        <div class="empty-icon">📂</div>
        <h3>No Contracts Found</h3>
        <p>You haven't signed any contracts yet.</p>
      </div>

      <div v-else class="contracts-list">
        <div 
          v-for="contract in contracts" 
          :key="contract.id" 
          class="contract-card"
          :class="{ 'is-active': contract.isActive }"
        >
          <div class="card-header">
            <div class="club-section">
              <div class="club-logo-placeholder">
                {{ contract.clubName ? contract.clubName.charAt(0).toUpperCase() : 'C' }}
              </div>
              <div class="club-details">
                <h3 class="club-name">{{ contract.clubName }}</h3>
                <span class="dates">
                  {{ formatDate(contract.startDate) }} — {{ formatDate(contract.endDate) }}
                </span>
              </div>
            </div>
            
            <div class="status-badge" :class="getStatusClass(contract.isActive, contract.endDate)">
              {{ getStatusLabel(contract.isActive, contract.endDate) }}
            </div>
          </div>

          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Monthly Salary</span>
                <span class="value salary">{{ formatCurrency(contract.salary, contract.currency) }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">Signed On</span>
                <span class="value">{{ formatDate(contract.assignedAt) }}</span>
              </div>

              <div class="info-item">
                <span class="label">Responsible Person</span>
                <span class="value">
                  {{ contract.responserName }} {{ contract.responserSurname }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="btn-page" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          Previous
        </button>
        <span class="page-count">Page {{ currentPage }} of {{ totalPages }}</span>
        <button 
          class="btn-page" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          Next
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Layout */
.page-container {
  width: 100%;
  min-height: 80vh;
  background-color: #f8fafc; /* Светлый фон страницы */
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.content-wrapper {
  max-width: 800px; /* Ограничиваем ширину для читаемости */
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 5px 0;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

/* States (Loading, Error, Empty) */
.state-box {
  background: white;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.state-box.error {
  background-color: #fef2f2;
  border-color: #fee2e2;
  color: #ef4444;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.btn-retry {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

/* Contracts List */
.contracts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contract-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.contract-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

/* Зеленая полоска слева для активных контрактов */
.contract-card.is-active {
  border-left: 5px solid #10b981;
}

/* Card Header */
.card-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.club-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.club-logo-placeholder {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.club-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.dates {
  font-size: 0.85rem;
  color: #64748b;
  display: block;
  margin-top: 2px;
}

/* Badges */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-active {
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid #d1fae5;
}

.status-expired {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.status-inactive {
  background-color: #fef2f2;
  color: #ef4444;
  border: 1px solid #fee2e2;
}

/* Card Body */
.card-body {
  padding: 20px 24px;
  background-color: #ffffff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 4px;
}

.value {
  font-size: 1rem;
  color: #334155;
  font-weight: 500;
}

.value.salary {
  font-family: 'Roboto Mono', monospace;
  font-weight: 600;
  color: #0f172a;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  gap: 20px;
}

.btn-page {
  padding: 10px 20px;
  background-color: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  border-color: #94a3b8;
  background-color: #f8fafc;
  color: #1e293b;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f1f5f9;
}

.page-count {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

/* Spinner */
.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .status-badge {
    align-self: flex-start;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
</style>
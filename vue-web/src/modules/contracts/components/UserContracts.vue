<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router'; // Добавлен импорт роутера
import { contractsService } from '../services/contractsService';
import { formatDate } from '@/utils/dateFormater';
import Spinner from '@/components/shared/Spinner.vue';

// --- ROUTER ---
const router = useRouter(); // Инициализация роутера

// --- STATE ---
const contracts = ref([]);
const isLoading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const activeTab = ref('active'); 

// Pagination
const currentPage = ref(1);
const pageSize = ref(10); 
const totalPages = ref(0);

// --- HELPERS ---
const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined) return 'N/A';
  const symbols = { 0: '$', 1: '€', 2: 'zł' };
  return `${symbols[currency] || ''} ${amount.toLocaleString()}`;
};

const getStatusClass = (isActive, endDate) => {
  if (isActive) return 'status-active';
  if (new Date(endDate) < new Date()) return 'status-expired';
  return 'status-inactive';
};

// Функция для перехода на страницу деталей
const goToContractDetails = (contractId) => {
  router.push({ name: 'ContractDetails', params: { id: contractId } });
};

// --- COMPUTED (Tabs & Search) ---
const filteredContracts = computed(() => {
  let result = contracts.value.filter(c => {
    if (activeTab.value === 'active') return c.isActive;
    return !c.isActive;
  });

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c => 
      c.clubName?.toLowerCase().includes(query) || 
      c.responserName?.toLowerCase().includes(query) ||
      c.responserSurname?.toLowerCase().includes(query)
    );
  }

  return result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
});

const activeCount = computed(() => contracts.value.filter(c => c.isActive).length);
const archivedCount = computed(() => contracts.value.filter(c => !c.isActive).length);

// --- API ---
const fetchContracts = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const result = await contractsService.getMyContracts(currentPage.value, pageSize.value);
    contracts.value = result.items || [];
    totalPages.value = result.totalPages || Math.ceil((result.totalCount || 0) / pageSize.value);
  } catch (err) {
    error.value = "Unable to load contracts. Please try again later.";
  } finally {
    isLoading.value = false;
  }
};

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  currentPage.value = newPage;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  fetchContracts();
};

onMounted(fetchContracts);
</script>

<template>
  <div class="content-wrapper">
    <div class="header-bar">
      <div class="header-left">
        <h2>My Contracts</h2>
      </div>
      
      <div class="header-center">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            class="search-input" 
            type="text" 
            placeholder="Search contracts..."
          >
        </div>
      </div>

      <div class="header-right"></div>
    </div>

    <div class="tabs-header">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'active' }" 
        @click="activeTab = 'active'"
      >
        Active
        <span v-if="activeCount" class="counter-badge">{{ activeCount }}</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'archived' }" 
        @click="activeTab = 'archived'"
      >
        Archived
        <span v-if="archivedCount" class="counter-badge">{{ archivedCount }}</span>
      </button>
    </div>

    <div class="contracts-view">
      <div v-if="isLoading" class="loading-state">
        <Spinner />
      </div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <button class="club-button join-btn" @click="fetchContracts">Try Again</button>
      </div>

      <div v-else-if="filteredContracts.length === 0" class="empty-state">
        <p>No {{ activeTab }} contracts found.</p>
      </div>

      <div v-else class="contracts-grid">
        <div 
          v-for="contract in filteredContracts" 
          :key="contract.id" 
          class="wide-contract-card clickable" 
          :class="{ 'is-active': contract.isActive }"
          @click="goToContractDetails(contract.id)"
        >
          <div class="card-left">
            <div class="club-avatar">
              {{ contract.clubName?.charAt(0).toUpperCase() }}
            </div>
            <div class="main-info">
              <h3>{{ contract.clubName }}</h3>
              <div class="status-pill" :class="getStatusClass(contract.isActive, contract.endDate)">
                {{ contract.isActive ? 'Active' : 'Archived' }}
              </div>
            </div>
          </div>

          <div class="card-center">
            <div class="info-group">
              <label>Duration</label>
              <span>{{ formatDate(contract.startDate) }} — {{ formatDate(contract.endDate) }}</span>
            </div>
            <div class="info-group">
              <label>Manager</label>
              <span>{{ contract.responserName }} {{ contract.responserSurname }}</span>
            </div>
          </div>

          <div class="card-right">
            <div class="salary-box">
              <label>Monthly Salary</label>
              <span class="amount">{{ formatCurrency(contract.salary, contract.currency) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1 && !searchQuery" class="pagination-footer">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Previous</button>
        <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Добавлен стиль для курсора и эффекта при наведении */
.clickable {
  cursor: pointer;
}

.wide-contract-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #eef0f2;
  transition: transform 0.2s, box-shadow 0.2s;
}

.wide-contract-card:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
}

/* ... (остальные стили без изменений) ... */
.content-wrapper { height: 100%; display: flex; flex-direction: column; }
.header-bar { display: flex; justify-content: space-between; align-items: center; height: 64px; padding: 0 20px; background-color: white; border-radius: 16px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.header-left h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
.search-wrapper { position: relative; width: 300px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.5; }
.search-input { width: 100%; padding: 10px 10px 10px 35px; border: 1px solid #e0e0e0; border-radius: 12px; outline: none; background-color: #f9f9f9; box-sizing: border-box; }
.search-input:focus { border-color: #007bff; background: white; }
.tabs-header { display: flex; gap: 10px; margin-bottom: 15px; padding: 0 10px; border-bottom: 1px solid #e0e0e0; }
.tab-btn { background: none; border: none; padding: 10px 20px; font-size: 15px; font-weight: 500; color: #666; cursor: pointer; position: relative; transition: color 0.2s; }
.tab-btn:hover { color: #007bff; }
.tab-btn.active { color: #007bff; font-weight: 600; }
.tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background-color: #007bff; }
.counter-badge { background: #eee; color: #333; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px; vertical-align: middle; }
.active .counter-badge { background: #e3f2fd; color: #007bff; }
.contracts-view { flex: 1; background-color: var(--gray, #f4f6f8); border-radius: 16px; padding: 20px; overflow-y: auto; }
.contracts-grid { display: flex; flex-direction: column; gap: 15px; }
.is-active { border-left: 4px solid #10b981; }
.card-left { display: flex; align-items: center; gap: 1rem; flex: 1; }
.club-avatar { width: 48px; height: 48px; background: var(--blue, #007bff); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; }
.main-info h3 { margin: 0 0 4px 0; font-size: 1.1rem; }
.status-pill { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
.status-active { background: #dcfce7; color: #15803d; }
.status-expired { background: #f3f4f6; color: #6b7280; }
.card-center { flex: 2; display: flex; justify-content: space-around; padding: 0 20px; }
.info-group { display: flex; flex-direction: column; }
.info-group label { font-size: 10px; color: #9ca3af; text-transform: uppercase; margin-bottom: 2px; }
.info-group span { font-size: 13px; font-weight: 600; color: #374151; }
.card-right { flex: 1; display: flex; justify-content: flex-end; }
.salary-box { text-align: right; }
.salary-box label { font-size: 10px; color: #9ca3af; display: block; }
.salary-box .amount { font-size: 1.25rem; font-weight: 700; color: var(--blue, #007bff); }
.loading-state, .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; }
.pagination-footer { margin-top: 20px; display: flex; justify-content: center; align-items: center; gap: 15px; }
.page-btn { padding: 6px 12px; border: 1px solid #e0e0e0; background: white; border-radius: 8px; font-size: 13px; cursor: pointer; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 768px) { .wide-contract-card { flex-direction: column; align-items: flex-start; gap: 1rem; } .card-center { padding: 0; width: 100%; justify-content: space-between; } .card-right { width: 100%; justify-content: flex-start; } }
</style>
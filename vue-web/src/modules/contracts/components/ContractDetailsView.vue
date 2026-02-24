<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contractsService } from '../services/contractsService';
import payslipsService from '@/modules/payslips/services/payslipService'; 
import { formatDate } from '@/utils/dateFormater';
import Spinner from '@/components/shared/Spinner.vue';

const route = useRoute();
const router = useRouter();

// Contract Data
const contract = ref(null);
const isContractLoading = ref(true);
const contractError = ref(null);
const isEnding = ref(false); // Состояние загрузки для кнопки завершения

// Payslips Data
const payslips = ref([]);
const payslipsTotal = ref(0);
const payslipsPage = ref(1);
const payslipsPageSize = ref(5);
const isPayslipsLoading = ref(false);

const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined) return 'N/A';
  const currCode = currency !== undefined ? currency : (contract.value?.currency || 0);
  const symbols = { 0: '$', 1: '€', 2: 'zł' };
  return `${symbols[currCode] || ''} ${Number(amount).toLocaleString()}`;
};

const getMonthName = (monthNum) => {
  const date = new Date();
  date.setMonth(monthNum - 1);
  return date.toLocaleString('en-US', { month: 'long' });
};

// --- DATA FETCHING ---

const fetchContractDetails = async () => {
  isContractLoading.value = true;
  try {
    const data = await contractsService.getContractById(route.params.id);
    contract.value = data;
  } catch (err) {
    contractError.value = "Failed to load contract details.";
  } finally {
    isContractLoading.value = false;
  }
};

const fetchPayslips = async () => {
  isPayslipsLoading.value = true;
  try {
    const response = await payslipsService.getContractPayslips(
      route.params.id, 
      payslipsPage.value, 
      payslipsPageSize.value
    );
    
    const data = response.data?.value || response.data;
    
    payslips.value = data.items || [];
    payslipsTotal.value = data.totalCount || 0;
  } catch (err) {
    console.error("Failed to load payslips", err);
  } finally {
    isPayslipsLoading.value = false;
  }
};

// --- ACTIONS ---

const endContract = async () => {
  if (!confirm("Are you sure you want to end this contract? This action cannot be undone.")) return;
  
  isEnding.value = true;
  try {
    await contractsService.endContract(route.params.id);
    await fetchContractDetails(); // Обновляем данные, статус должен измениться на Archived
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Failed to end contract");
  } finally {
    isEnding.value = false;
  }
};

const changePayslipPage = (newPage) => {
  const totalPages = Math.ceil(payslipsTotal.value / payslipsPageSize.value);
  if (newPage < 1 || newPage > totalPages) return;
  payslipsPage.value = newPage;
  fetchPayslips();
};

const totalPayslipPages = computed(() => Math.ceil(payslipsTotal.value / payslipsPageSize.value));

const getPayslipStatusClass = (status) => {
  const s = String(status).toLowerCase();
  if (s === 'paid' || s === 'confirmed') return 'status-success';
  if (s === 'pending' || s === 'generated') return 'status-warning';
  return 'status-danger';
};

onMounted(() => {
  fetchContractDetails();
  fetchPayslips();
});
</script>

<template>
  <div class="content-wrapper full-width">
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="router.back()">← Back</button>
        <h2>Contract #{{ route.params.id.slice(0, 8) }}</h2>
      </div>
      <div class="header-right">
        <button 
          v-if="contract?.isActive" 
          class="btn-danger-outline" 
          @click="endContract" 
          :disabled="isEnding"
        >
          {{ isEnding ? 'Processing...' : 'End Contract' }}
        </button>
        
        <div v-if="contract" class="status-badge" :class="contract.isActive ? 'status-active' : 'status-expired'">
          {{ contract.isActive ? 'Active' : 'Archived' }}
        </div>
      </div>
    </div>

    <div class="details-view">
      <div v-if="isContractLoading" class="loading-state">
        <Spinner />
      </div>

      <div v-else-if="contractError" class="empty-state">
        <p class="error-text">{{ contractError }}</p>
        <button class="club-button join-btn" @click="fetchContractDetails">Retry</button>
      </div>

      <div v-else-if="contract" class="contract-container">
        <div class="info-row main-info">
          <div class="info-group club-info">
            <div class="club-avatar large">
              {{ contract.clubName?.charAt(0).toUpperCase() }}
            </div>
            <div class="text-content">
              <h3 class="club-title">{{ contract.clubName }}</h3>
              <p class="meta-info">Assigned on {{ formatDate(contract.assignedAt) }}</p>
            </div>
          </div>
          
          <div class="info-group financial-info">
            <label>Monthly Salary</label>
            <div class="salary-amount">
              {{ formatCurrency(contract.salary, contract.currency) }}
            </div>
          </div>
        </div>

        <div class="details-grid-full">
          <div class="detail-section">
            <div class="section-title">Validity Period</div>
            <div class="section-body horizontal">
              <div class="data-item">
                <label>Start Date</label>
                <div class="value">{{ formatDate(contract.startDate) }}</div>
              </div>
              <div class="separator"></div>
              <div class="data-item">
                <label>End Date</label>
                <div class="value">{{ formatDate(contract.endDate) }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">Participants</div>
            <div class="section-body horizontal">
              <div class="data-item">
                <label>Contract Holder (Member)</label>
                <div class="value user">{{ contract.memberName }} {{ contract.memberSurname }}</div>
              </div>
              <div class="separator"></div>
              <div class="data-item">
                <label>Responsible Person</label>
                <div class="value user">
                  {{ contract.responserName }} {{ contract.responserSurname }}
                  <router-link :to="`/app/profile/${contract.responserUserName}`" class="user-link">
                    (@{{ contract.responserUserName }})
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section full-width-section">
            <div class="section-title">Payslip History</div>
            
            <div class="section-body">
              <div v-if="isPayslipsLoading" class="mini-loader">
                <Spinner />
              </div>
              
              <div v-else-if="payslips.length === 0" class="empty-list">
                No payslips generated for this contract yet.
              </div>

              <div v-else class="payslips-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Base Salary</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="slip in payslips" :key="slip.id">
                      <td>
                        <span class="period-text">{{ getMonthName(slip.month) }} {{ slip.year }}</span>
                      </td>
                      <td class="text-muted">{{ formatCurrency(slip.baseSalary) }}</td>
                      <td class="amount-cell">{{ formatCurrency(slip.totalAmount) }}</td>
                      <td>
                        <span class="status-badge-small" :class="getPayslipStatusClass(slip.status)">
                          {{ slip.status }}
                        </span>
                      </td>
                      <td>
                        <button class="btn-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div class="pagination-footer" v-if="totalPayslipPages > 1">
                  <button 
                    class="page-btn" 
                    :disabled="payslipsPage === 1" 
                    @click="changePayslipPage(payslipsPage - 1)"
                  >
                    ←
                  </button>
                  <span class="page-info">Page {{ payslipsPage }} of {{ totalPayslipPages }}</span>
                  <button 
                    class="page-btn" 
                    :disabled="payslipsPage === totalPayslipPages" 
                    @click="changePayslipPage(payslipsPage + 1)"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper.full-width {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 20px;
  background-color: white;
  border-radius: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--blue, #4B9BD4);
  cursor: pointer;
  font-weight: 600;
  margin-right: 15px;
}

.btn-danger-outline {
  background: transparent;
  border: 1px solid #fca5a5;
  color: #ef4444;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-danger-outline:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #ef4444;
}

.btn-danger-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.details-view {
  flex: 1;
  background-color: var(--gray, #f4f6f8);
  border-radius: 16px;
  padding: 24px;
  overflow-y: auto;
}

.contract-container {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Main Info Bar */
.info-row.main-info {
  background: white;
  padding: 30px;
  border-radius: 16px;
  border: 1px solid #eef0f2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.club-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.club-avatar.large {
  width: 80px;
  height: 80px;
  background: var(--blue, #4B9BD4);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.club-title {
  font-size: 1.8rem;
  margin: 0;
  color: #1a1a1a;
}

.meta-info {
  color: #888;
  margin: 5px 0 0 0;
}

.financial-info {
  text-align: right;
}

.financial-info label {
  font-size: 0.9rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.salary-amount {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--blue, #4B9BD4);
}

/* Sections */
.detail-section {
  background: white;
  border-radius: 16px;
  border: 1px solid #eef0f2;
  overflow: hidden;
  margin-bottom: 20px;
}

.section-title {
  background: #fcfdfe;
  padding: 15px 30px;
  border-bottom: 1px solid #f1f3f5;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.section-body {
  padding: 20px 30px;
}

.section-body.horizontal {
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 60px;
}

.data-item label {
  display: block;
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 8px;
}

.data-item .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3436;
}

.data-item .value.user {
  color: #1a1a1a;
}

.separator {
  width: 1px;
  height: 40px;
  background: #eee;
}

.user-link {
  color: var(--blue, #4B9BD4);
  text-decoration: none;
  font-size: 1rem;
  margin-left: 5px;
}

.user-link:hover {
  text-decoration: underline;
}

/* Badges */
.status-badge {
  padding: 8px 20px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-active { background: #dcfce7; color: #15803d; }
.status-expired { background: #f3f4f6; color: #6b7280; }

.loading-state, .empty-state {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* --- Payslips Table Styles --- */
.mini-loader {
  display: flex;
  justify-content: center;
  padding: 30px;
}

.empty-list {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
  font-style: italic;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  padding: 12px 10px;
  border-bottom: 1px solid #eef0f2;
}

.data-table td {
  padding: 16px 10px;
  font-size: 0.95rem;
  color: #334155;
  border-bottom: 1px solid #f8fafc;
}

.period-text {
  font-weight: 600;
  color: #0f172a;
}

.text-muted {
  color: #94a3b8;
}

.amount-cell {
  font-weight: 700;
  color: var(--blue, #4B9BD4);
}

.status-badge-small {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Status colors (Soft UI) */
.status-success { background: #ecfdf5; color: #047857; }
.status-warning { background: #fffbeb; color: #b45309; }
.status-danger { background: #fef2f2; color: #b91c1c; }

.btn-icon {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.btn-icon:hover {
  background: #f1f5f9;
  color: var(--blue, #4B9BD4);
}

/* Pagination */
.pagination-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
}

.page-btn {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--blue, #4B9BD4);
  color: var(--blue, #4B9BD4);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.page-info {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

@media (max-width: 768px) {
  .info-row.main-info {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  .financial-info { text-align: center; }
  .section-body.horizontal {
    flex-direction: column;
    gap: 30px;
    align-items: flex-start;
  }
  .separator { display: none; }
  
  /* Make table scrollable on small screens */
  .payslips-table-wrapper {
    overflow-x: auto;
  }
  .data-table th, .data-table td {
    white-space: nowrap;
  }
}
</style>
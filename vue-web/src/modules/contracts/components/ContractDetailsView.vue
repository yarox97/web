<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contractsService } from '../services/contractsService';
import api from '@/services/api'; 
import { formatDate } from '@/utils/dateFormater';
import Spinner from '@/components/shared/Spinner.vue';

import { useAuthStore } from '@/stores/authStore'; 

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore(); 

const contract = ref(null);
const isContractLoading = ref(true);
const contractError = ref(null);
const isEnding = ref(false); 

const payslips = ref([]);
const payslipsTotal = ref(0);
const payslipsPage = ref(1);
const payslipsPageSize = ref(5);
const isPayslipsLoading = ref(false);
const isMarkingPaid = ref(false); 

// --- STATE: Adjustments Modal ---
const isModalOpen = ref(false);
const selectedPayslip = ref(null);
const adjustments = ref([]);
const adjustmentsTotal = ref(0);
const adjustmentsPage = ref(1);
const adjustmentsPageSize = ref(5);
const isAdjustmentsLoading = ref(false);
const isReverting = ref(false);

const currentUserRole = computed(() => {
  if (!contract.value?.clubId || !authStore.user) return null;
  const clubs = authStore.user.clubDtos || authStore.user.clubs || [];
  const currentClub = clubs.find(c => c.clubId === contract.value.clubId);
  return currentClub?.role || authStore.user.role; 
});

const canManagePayslips = computed(() => {
  return currentUserRole.value === 'President' || currentUserRole.value === 'Creator';
});

const canManageAdjustments = computed(() => {
  return currentUserRole.value === 'President' || currentUserRole.value === 'Creator';
});

const markAsPaid = async (payslipId) => {
  if (!confirm("Confirm marking this payslip as Paid?")) return;

  isMarkingPaid.value = true;
  try {
    await api.put(`/api/payslips/${payslipId}/mark-as-paid`);
    await fetchPayslips(); 
  } catch (err) {
    console.error("Failed to mark as paid", err);
    alert(err.response?.data?.message || "Error updating status");
  } finally {
    isMarkingPaid.value = false;
  }
};

const handleRevertAdjustment = async (adjustmentId) => {
  if (!confirm("Are you sure you want to revert this adjustment? This action will update the payslip total.")) return;

  isReverting.value = true;
  try {
    await api.put('/api/payslips/adjustments/revert', [adjustmentId]);
    await fetchAdjustments();
    await fetchPayslips(); 
  } catch (err) {
    console.error("Failed to revert adjustment", err);
    alert(err.response?.data?.message || "Error reverting adjustment");
  } finally {
    isReverting.value = false;
  }
};

const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined) return 'N/A';
  const currCode = currency !== undefined ? currency : (contract.value?.currency || 0);
  const symbols = { 0: '$', 1: '€', 2: 'zł' };
  return `${symbols[currCode] || ''} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getMonthName = (monthNum) => {
  if (!monthNum) return '';
  const date = new Date();
  date.setMonth(monthNum - 1);
  return date.toLocaleString('en-US', { month: 'long' });
};

const getAdjustmentStyle = (type) => {
  const t = String(type).toLowerCase();
  if (t.includes('bonus') || t.includes('bouns') || t.includes('premia') || t.includes('reward')) {
    return { color: '#047857', bg: '#ecfdf5', sign: '+' };
  }
  return { color: '#b91c1c', bg: '#fef2f2', sign: '-' }; 
};

const formatAdjustmentType = (type) => {
  const t = String(type);
  if (t === 'BonusValue') return 'Bonus';
  if (t === 'BounsPercent' || t === 'BonusPercent') return 'Bonus (%)';
  if (t === 'PenaltyValue') return 'Penalty';
  if (t === 'PenaltyPercent') return 'Penalty (%)';
  return t;
};

const isPercentAdjustment = (type) => {
  const t = String(type).toLowerCase();
  return t.includes('percent');
};

const calculateActualAmount = (adj) => {
  if (isPercentAdjustment(adj.type)) {
    const baseSalary = selectedPayslip.value?.baseSalary || 0;
    return (baseSalary * adj.amount) / 100;
  }
  return adj.amount; 
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
    const response = await api.get(`/api/payslips/contract/${route.params.id}/my`, {
      params: { 
        page: payslipsPage.value, 
        pageSize: payslipsPageSize.value
      }
    });
    const data = response.data?.value || response.data;
    payslips.value = data.items || [];
    payslipsTotal.value = data.totalCount || 0;
  } catch (err) {
    console.error("Failed to load payslips", err);
  } finally {
    isPayslipsLoading.value = false;
  }
};

onMounted(() => {
  fetchContractDetails();
  fetchPayslips();
});

// --- ADJUSTMENTS MODAL LOGIC ---
const openAdjustmentsModal = (slip) => {
  selectedPayslip.value = slip;
  isModalOpen.value = true;
  adjustmentsPage.value = 1;
  fetchAdjustments();
};

const closeAdjustmentsModal = () => {
  isModalOpen.value = false;
  selectedPayslip.value = null;
  adjustments.value = [];
};

const fetchAdjustments = async () => {
  if (!selectedPayslip.value) return;
  isAdjustmentsLoading.value = true;
  try {
    const response = await api.get(`/api/payslips/contract/${selectedPayslip.value.id}`, {
      params: { 
        page: adjustmentsPage.value, 
        pageSize: adjustmentsPageSize.value 
      }
    });
    const data = response.data?.value || response.data;
    adjustments.value = data.items || [];
    adjustmentsTotal.value = data.totalCount || 0;
  } catch (err) {
    console.error("Failed to load adjustments", err);
  } finally {
    isAdjustmentsLoading.value = false;
  }
};

// --- PAGINATION HELPERS ---
const changeAdjustmentsPage = (newPage) => {
  const totalPages = Math.ceil(adjustmentsTotal.value / adjustmentsPageSize.value);
  if (newPage < 1 || newPage > totalPages) return;
  adjustmentsPage.value = newPage;
  fetchAdjustments();
};

const changePayslipPage = (newPage) => {
  const totalPages = Math.ceil(payslipsTotal.value / payslipsPageSize.value);
  if (newPage < 1 || newPage > totalPages) return;
  payslipsPage.value = newPage;
  fetchPayslips();
};

const totalAdjustmentsPages = computed(() => Math.ceil(adjustmentsTotal.value / adjustmentsPageSize.value) || 1);
const totalPayslipPages = computed(() => Math.ceil(payslipsTotal.value / payslipsPageSize.value));

const endContract = async () => {
  if (!confirm("Are you sure you want to end this contract? This action cannot be undone.")) return;
  isEnding.value = true;
  try {
    await contractsService.endContract(route.params.id);
    await fetchContractDetails(); 
  } catch (err) {
    alert(err.response?.data?.message || "Failed to end contract");
  } finally {
    isEnding.value = false;
  }
};

const getPayslipStatusClass = (status) => {
  const s = String(status).toLowerCase();
  if (s === 'paid' || s === 'confirmed') return 'status-success';
  if (s === 'pending' || s === 'generated' || s === 'draft' || s === 'approved') return 'status-warning';
  return 'status-danger';
};
</script>

<template>
  <div class="content-wrapper full-width">
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="router.back()">← Back</button>
        <h2>Contract #{{ route.params.id.slice(0, 8) }}</h2>
      </div>
      <div class="header-right">
        <button v-if="contract?.isActive" class="btn-danger-outline" @click="endContract" :disabled="isEnding">
          {{ isEnding ? 'Processing...' : 'End Contract' }}
        </button>
        <div v-if="contract" class="status-badge" :class="contract.isActive ? 'status-active' : 'status-expired'">
          {{ contract.isActive ? 'Active' : 'Archived' }}
        </div>
      </div>
    </div>

    <div class="details-view">
      <div v-if="isContractLoading" class="loading-state"><Spinner /></div>
      <div v-else-if="contractError" class="empty-state">
        <p class="error-text">{{ contractError }}</p>
        <button class="club-button join-btn" @click="fetchContractDetails">Retry</button>
      </div>

      <div v-else-if="contract" class="contract-container">
        <div class="info-row main-info">
          <div class="info-group club-info">
            <div class="club-avatar large">{{ contract.clubName?.charAt(0).toUpperCase() }}</div>
            <div class="text-content">
              <h3 class="club-title">{{ contract.clubName }}</h3>
              <p class="meta-info">Assigned on {{ formatDate(contract.assignedAt) }}</p>
            </div>
          </div>
          <div class="info-group financial-info">
            <label>Monthly Salary</label>
            <div class="salary-amount">{{ formatCurrency(contract.salary, contract.currency) }}</div>
          </div>
        </div>

        <div class="details-grid-full">
          <div class="detail-section">
            <div class="section-title">Validity Period</div>
            <div class="section-body horizontal">
              <div class="data-item"><label>Start Date</label><div class="value">{{ formatDate(contract.startDate) }}</div></div>
              <div class="separator"></div>
              <div class="data-item"><label>End Date</label><div class="value">{{ formatDate(contract.endDate) }}</div></div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">Participants</div>
            <div class="section-body horizontal">
              <div class="data-item"><label>Contract Holder</label><div class="value user">{{ contract.memberName }} {{ contract.memberSurname }}</div></div>
              <div class="separator"></div>
              <div class="data-item">
                <label>Responsible Person</label>
                <div class="value user">
                  {{ contract.responserName }} {{ contract.responserSurname }}
                  <router-link :to="`/app/profile/${contract.responserUserName}`" class="user-link">(@{{ contract.responserUserName }})</router-link>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section full-width-section">
            <div class="section-title">Payslip History</div>
            <div class="section-body">
              <div v-if="isPayslipsLoading" class="mini-loader"><Spinner /></div>
              <div v-else-if="payslips.length === 0" class="empty-list">No payslips generated for this contract yet.</div>

              <div v-else class="payslips-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Base Salary</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th v-if="canManagePayslips" style="text-align: center;">Action</th>
                      <th style="text-align: right;">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="slip in payslips" :key="slip.id">
                      <td><span class="period-text">{{ getMonthName(slip.month) }} {{ slip.year }}</span></td>
                      <td class="text-muted">{{ formatCurrency(slip.baseSalary) }}</td>
                      <td class="amount-cell">{{ formatCurrency(slip.totalAmount) }}</td>
                      <td>
                        <span class="status-badge-small" :class="getPayslipStatusClass(slip.status)">
                          {{ slip.status }}
                        </span>
                      </td>
                      
                      <td v-if="canManagePayslips" style="text-align: center;">
                        <button 
                          v-if="String(slip.status).toLowerCase() !== 'paid'"
                          class="btn-pay"
                          @click="markAsPaid(slip.id)"
                          :disabled="isMarkingPaid"
                        >
                          Mark Paid
                        </button>
                        <span v-else class="text-muted" style="font-size: 0.8rem;">Paid</span>
                      </td>

                      <td style="text-align: right;">
                        <button class="btn-icon" @click="openAdjustmentsModal(slip)" title="View Adjustments">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="pagination-footer" v-if="totalPayslipPages > 1">
                  <button class="page-btn" :disabled="payslipsPage === 1" @click="changePayslipPage(payslipsPage - 1)">←</button>
                  <span class="page-info">Page {{ payslipsPage }} of {{ totalPayslipPages }}</span>
                  <button class="page-btn" :disabled="payslipsPage === totalPayslipPages" @click="changePayslipPage(payslipsPage + 1)">→</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="fade">
        <div v-if="isModalOpen" class="modal-overlay" @click.self="closeAdjustmentsModal">
          <div class="modal-content">
            
            <div class="modal-header">
              <h3>Adjustments: {{ getMonthName(selectedPayslip?.month) }} {{ selectedPayslip?.year }}</h3>
              <button class="modal-close-btn" @click="closeAdjustmentsModal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div class="modal-body">
              <div v-if="isAdjustmentsLoading" class="mini-loader"><Spinner /></div>
              <div v-else-if="adjustments.length === 0" class="empty-list">No adjustments for this month.</div>

              <div v-else class="payslips-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th style="text-align: right;">Amount</th>
                      <th v-if="canManageAdjustments" style="width: 45px;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="adj in adjustments" 
                      :key="adj.id"
                      :class="{ 'adjustment-reverted': adj.isReverted }"
                    >
                      <td class="text-muted" style="font-size: 0.85rem;">{{ formatDate(adj.date) }}</td>
                      <td>
                        <span class="status-badge-small" :style="adj.isReverted ? { backgroundColor: '#f1f5f9', color: '#94a3b8' } : { backgroundColor: getAdjustmentStyle(adj.type).bg, color: getAdjustmentStyle(adj.type).color }">
                          {{ formatAdjustmentType(adj.type) }}
                        </span>
                      </td>
                      <td class="reason-cell">
                        <span :class="{ 'strike-text': adj.isReverted }">{{ adj.reason || 'Manual adjustment' }}</span>
                        <em v-if="adj.isReverted" class="reverted-label">(Cancelled)</em>
                      </td>
                      
                      <td style="text-align: right; font-weight: bold;" :style="adj.isReverted ? { color: '#cbd5e1' } : { color: getAdjustmentStyle(adj.type).color }">
                        <span :class="{ 'strike-text': adj.isReverted }">
                          {{ getAdjustmentStyle(adj.type).sign }} {{ formatCurrency(calculateActualAmount(adj)) }}
                          
                          <span v-if="isPercentAdjustment(adj.type)" style="font-size: 0.75rem; font-weight: 500; opacity: 0.7; margin-left: 4px;">
                            ({{ adj.amount }}%)
                          </span>
                        </span>
                      </td>
                      
                      <td v-if="canManageAdjustments" style="text-align: right;">
                        <button 
                          v-if="!adj.isReverted"
                          class="btn-revert-action"
                          @click="handleRevertAdjustment(adj.id)"
                          :disabled="isReverting"
                          title="Revert adjustment"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="pagination-footer" style="padding-bottom: 0; border: none;" v-if="totalAdjustmentsPages > 1">
                  <button class="page-btn" :disabled="adjustmentsPage === 1" @click="changeAdjustmentsPage(adjustmentsPage - 1)">←</button>
                  <span class="page-info">Page {{ adjustmentsPage }} of {{ totalAdjustmentsPages }}</span>
                  <button class="page-btn" :disabled="adjustmentsPage === totalAdjustmentsPages" @click="changeAdjustmentsPage(adjustmentsPage + 1)">→</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* BASE STYLES */
.content-wrapper.full-width { height: 100%; display: flex; flex-direction: column; width: 100%; }
.header-bar { display: flex; justify-content: space-between; align-items: center; height: 64px; padding: 0 20px; background: white; border-radius: 16px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.header-left { display: flex; align-items: center; }
.header-right { display: flex; align-items: center; gap: 15px; }
.back-btn { background: none; border: none; color: #4B9BD4; cursor: pointer; font-weight: 600; margin-right: 15px; }
.btn-danger-outline { background: transparent; border: 1px solid #fca5a5; color: #ef4444; padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-danger-outline:hover:not(:disabled) { background: #fef2f2; border-color: #ef4444; }
.btn-danger-outline:disabled { opacity: 0.5; cursor: not-allowed; }

.details-view { flex: 1; background-color: #f4f6f8; border-radius: 16px; padding: 24px; overflow-y: auto; }
.contract-container { max-width: 100%; display: flex; flex-direction: column; gap: 20px; }

/* INFO CARDS */
.info-row.main-info { background: white; padding: 30px; border-radius: 16px; border: 1px solid #eef0f2; display: flex; justify-content: space-between; align-items: center; }
.club-info { display: flex; align-items: center; gap: 20px; }
.club-avatar.large { width: 80px; height: 80px; background: #4B9BD4; color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; }
.club-title { font-size: 1.8rem; margin: 0; color: #1a1a1a; }
.meta-info { color: #888; margin: 5px 0 0 0; }
.financial-info { text-align: right; }
.financial-info label { font-size: 0.9rem; color: #6c757d; text-transform: uppercase; letter-spacing: 1px; }
.salary-amount { font-size: 2.5rem; font-weight: 800; color: #4B9BD4; }

.detail-section { background: white; border-radius: 16px; border: 1px solid #eef0f2; overflow: hidden; margin-bottom: 20px; }
.section-title { background: #fcfdfe; padding: 15px 30px; border-bottom: 1px solid #f1f3f5; font-weight: 700; color: #495057; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; }
.section-body { padding: 20px 30px; }
.section-body.horizontal { padding: 30px; display: flex; align-items: center; gap: 60px; }
.data-item label { display: block; font-size: 0.85rem; color: #888; margin-bottom: 8px; }
.data-item .value { font-size: 1.25rem; font-weight: 600; color: #2d3436; }
.separator { width: 1px; height: 40px; background: #eee; }
.user-link { color: #4B9BD4; text-decoration: none; font-size: 1rem; margin-left: 5px; }
.user-link:hover { text-decoration: underline; }

/* BADGES */
.status-badge { padding: 8px 20px; border-radius: 30px; font-weight: 700; font-size: 0.9rem; text-transform: uppercase; }
.status-active { background: #dcfce7; color: #15803d; }
.status-expired { background: #f3f4f6; color: #6b7280; }
.status-badge-small { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block; }
.status-success { background: #ecfdf5; color: #047857; }
.status-warning { background: #fffbeb; color: #b45309; }
.status-danger { background: #fef2f2; color: #b91c1c; }

/* TABLE */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; padding: 12px 10px; border-bottom: 1px solid #eef0f2; }
.data-table td { padding: 16px 10px; font-size: 0.95rem; color: #334155; border-bottom: 1px solid #f8fafc; }
.amount-cell { font-weight: 700; color: #4B9BD4; }
.btn-icon { background: #f1f5f9; border: none; color: #64748b; cursor: pointer; padding: 8px; border-radius: 8px; transition: 0.2s; display: inline-flex; }
.btn-icon:hover { background: #e2e8f0; color: #4B9BD4; }

/* MARK PAID BUTTON */
.btn-pay {
  background-color: white;
  border: 1px solid #10b981;
  color: #10b981;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-pay:hover:not(:disabled) {
  background-color: #10b981;
  color: white;
}
.btn-pay:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* PAGINATION */
.pagination-footer { display: flex; justify-content: flex-end; align-items: center; gap: 15px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #f1f5f9; }
.page-btn { background: white; border: 1px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; color: #64748b; }
.page-btn:hover:not(:disabled) { border-color: #4B9BD4; color: #4B9BD4; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
.modal-content { background: white; border-radius: 16px; width: 100%; max-width: 800px; max-height: 85vh; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.3s ease-out forwards; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.modal-close-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; }
.modal-body { padding: 24px; overflow-y: auto; }

/* REVERT STYLES */
.adjustment-reverted { background-color: #fafafa; }
.strike-text { text-decoration: line-through; opacity: 0.6; }
.reverted-label { display: block; font-size: 0.7rem; color: #ef4444; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
.btn-revert-action { background: none; border: 1px solid #e2e8f0; color: #94a3b8; cursor: pointer; padding: 5px; border-radius: 6px; display: inline-flex; align-items: center; transition: all 0.2s; }
.btn-revert-action:hover:not(:disabled) { background: #fef2f2; border-color: #fca5a5; color: #ef4444; transform: rotate(-30deg); }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
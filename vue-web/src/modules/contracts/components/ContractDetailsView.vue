<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { contractsService } from '../services/contractsService';
import { formatDate } from '@/utils/dateFormater';
import Spinner from '@/components/shared/Spinner.vue';

const route = useRoute();
const router = useRouter();

const contract = ref(null);
const isLoading = ref(true);
const error = ref(null);

const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined) return 'N/A';
  const symbols = { 0: '$', 1: '€', 2: 'zł' };
  return `${symbols[currency] || ''} ${amount.toLocaleString()}`;
};

const fetchContractDetails = async () => {
  isLoading.value = true;
  try {
    const data = await contractsService.getContractById(route.params.id);
    contract.value = data;
  } catch (err) {
    error.value = "Failed to load contract details. It may not exist or you don't have permission.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchContractDetails);
</script>

<template>
  <div class="content-wrapper full-width">
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="router.back()">← Back</button>
        <h2>Contract #{{ route.params.id.slice(0, 8) }}</h2>
      </div>
      <div class="header-right">
        <div v-if="contract" class="status-badge" :class="contract.isActive ? 'status-active' : 'status-expired'">
          {{ contract.isActive ? 'Active' : 'Archived' }}
        </div>
      </div>
    </div>

    <div class="details-view">
      <div v-if="isLoading" class="loading-state">
        <Spinner />
      </div>

      <div v-else-if="error" class="empty-state">
        <p class="error-text">{{ error }}</p>
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

.back-btn {
  background: none;
  border: none;
  color: var(--blue, #4B9BD4);
  cursor: pointer;
  font-weight: 600;
  margin-right: 15px;
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
}
</style>
<script setup>
import { computed, onMounted, ref, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getAvatar } from '@/utils/getAvatar';
import { useExternalProfile } from '@/modules/profile/composables/useExternalProfile';
import api from '@/services/api';

import SalaryPiechart from '@/components/profile/SalaryPiechart.vue';
import ActivityBarChart from '@/components/profile/ActivityBarChart.vue';
import Spinner from '@/components/shared/Spinner.vue';
import ProfileHeader from '@/modules/profile/components/ProfileHeader.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isMyProfile = computed(() => {
  if (route.path.includes('/profile/me')) return true;
  if (!route.params.username) return true; 
  return route.params.username === authStore.user?.userName;
});

const { 
  externalUser, 
  externalLoading, 
  externalError, 
  fetchProfile 
} = useExternalProfile(isMyProfile);

const displayedUser = computed(() => {
  return isMyProfile.value ? authStore.user : externalUser.value;
});

const displayedAvatar = computed(() => {
  if (isMyProfile.value) return authStore.userAvatar; 

  const user = externalUser.value;
  if (user?.avatarUrl) return user.avatarUrl;
  
  const name = user ? `${user.firstName} ${user.lastName}` : 'User';
  return getAvatar(name);
});

const handleUserUpdated = async () => {
  if (isMyProfile.value) {
    if (typeof authStore.fetchUser === 'function') {
      await authStore.fetchUser();
    } else if (typeof authStore.getMe === 'function') {
      await authStore.getMe();
    }
  }
  await fetchProfile();
};

const clubsPage = ref(1);
const clubsPageSize = ref(3); 

const myClubs = computed(() => {
  return displayedUser.value?.clubDtos || displayedUser.value?.clubs || externalUser.value?.clubDtos || [];
});

const totalClubsPages = computed(() => {
  return Math.ceil(myClubs.value.length / clubsPageSize.value);
});

const paginatedClubs = computed(() => {
  const start = (clubsPage.value - 1) * clubsPageSize.value;
  const end = start + clubsPageSize.value;
  return myClubs.value.slice(start, end);
});

const changeClubsPage = (newPage) => {
  if (newPage >= 1 && newPage <= totalClubsPages.value) {
    clubsPage.value = newPage;
  }
};

const goToClub = (clubId) => {
  router.push({ name: 'ClubDetails', params: { id: clubId } });
};

const isEditingAttr = ref(false);
const isSavingAttr = ref(false);

const attrForm = reactive({
  position: '',
  heightCm: '',
  weightKg: '',
  dominantHand: '',
  spikeReachCm: '',
  blockReachCm: ''
});

const formatPosition = (val) => {
  if (!val || val === 'None' || val === 0) return null;
  const map = {
    'OutsideHitter': 'Outside Hitter',
    'Setter': 'Setter',
    'Libero': 'Libero',
    'MiddleBlocker': 'Middle Blocker',
    'OppositeHitter': 'Opposite Hitter'
  };
  return map[val] || val;
};

const formatHand = (val) => {
  if (!val || val === 'None' || val === 0) return null;
  return val; 
};

const hasAttributes = computed(() => {
  const a = currentAttr.value;
  if (!a) return false;
  return !!(
    (a.position && a.position !== 'None' && a.position !== 0) || 
    a.heightCm || a.weightKg || 
    (a.dominantHand && a.dominantHand !== 'None' && a.dominantHand !== 0) || 
    a.spikeReachCm || a.blockReachCm
  );
});

const currentAttr = computed(() => {
  return externalUser.value?.attributes || externalUser.value?.Attributes || 
         displayedUser.value?.attributes || displayedUser.value?.Attributes || {};
});

const startEditAttr = () => {
  const a = currentAttr.value;
  attrForm.position = a.position && a.position !== 'None' ? a.position : '';
  attrForm.heightCm = a.heightCm || '';
  attrForm.weightKg = a.weightKg || '';
  attrForm.dominantHand = a.dominantHand && a.dominantHand !== 'None' ? a.dominantHand : '';
  attrForm.spikeReachCm = a.spikeReachCm || '';
  attrForm.blockReachCm = a.blockReachCm || '';
  isEditingAttr.value = true;
};

const cancelEditAttr = () => {
  isEditingAttr.value = false;
};

const saveAttributes = async () => {
  isSavingAttr.value = true;
  try {
    const payload = {
      position: attrForm.position || null,
      heightCm: attrForm.heightCm ? Number(attrForm.heightCm) : null,
      weightKg: attrForm.weightKg ? Number(attrForm.weightKg) : null,
      dominantHand: attrForm.dominantHand || null,
      spikeReachCm: attrForm.spikeReachCm ? Number(attrForm.spikeReachCm) : null,
      blockReachCm: attrForm.blockReachCm ? Number(attrForm.blockReachCm) : null,
    };

    await api.put('/api/user/modify-attributes', payload);
    
    if (externalUser.value) {
      externalUser.value.attributes = { ...payload };
    }
    if (isMyProfile.value && authStore.user) {
      authStore.user.attributes = { ...payload };
    }

    isEditingAttr.value = false;
    await handleUserUpdated();

  } catch (error) {
    console.error("Failed to update attributes", error);
    alert(error.response?.data?.message || "Failed to update attributes.");
  } finally {
    isSavingAttr.value = false;
  }
};

const matchesPlayed = computed(() => displayedUser.value?.matchesPlayed || displayedUser.value?.MatchesPlayed || 0);
const tasksFinished = computed(() => displayedUser.value?.tasksFinished || displayedUser.value?.TasksFinished || 0);
const taskCompletionRate = computed(() => displayedUser.value?.taskCompletionRate || displayedUser.value?.TaskCompletionRate || 0);

const trendLabels = ref([]);
const trendTasks = ref([]);
const trendMatches = ref([]);
const isTrendsLoading = ref(true);

const fetchTrends = async (userId) => {
  if (!userId) return;
  
  isTrendsLoading.value = true;
  try {
    const response = await api.get(`/api/user/tasks-trends?userId=${userId}`);
    
    const data = response.data?.value || response.data; 

    if (data) {
      trendLabels.value = data.labels || [];
      trendTasks.value = data.tasksTrend || [];
      trendMatches.value = data.matchesTrend || [];
    }
  } catch (error) {
    console.error("Failed to load activity trends", error);
  } finally {
    isTrendsLoading.value = false;
  }
};

watch(() => displayedUser.value, (newUser) => {
  const userId = newUser?.id || newUser?.userId;
  if (userId) {
    fetchTrends(userId);
  }
}, { immediate: true });

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="profile-container">
    
    <div v-if="authStore.isLoading || externalLoading" class="state-box">
      <Spinner></Spinner>
    </div>

    <div v-else-if="externalError" class="state-box error">
       <p>{{ externalError }}</p>
    </div>

    <div v-else-if="!displayedUser" class="state-box">
      <p>Profile not found.</p>
    </div>

    <div v-else class="profile-wrapper">

      <ProfileHeader 
        :user="displayedUser" 
        :avatar="displayedAvatar"
        :can-edit="isMyProfile"
        @user-updated="handleUserUpdated"
      ></ProfileHeader>
      
      <div class="grid-row" :class="isMyProfile ? 'grid-top-3' : 'grid-top-2'">
        
        <div class="card attr-card">
           <div class="card-header-flex">
             <h3 class="section-title">Player Attributes</h3>
             <button 
                v-if="isMyProfile && !isEditingAttr && hasAttributes" 
                class="btn-text" 
                @click="startEditAttr"
             >
                Edit
             </button>
           </div>

           <div v-if="isEditingAttr" class="attr-form">
              <div class="form-grid">
                <div class="input-group">
                  <label>Court Position</label>
                  <select v-model="attrForm.position" :disabled="isSavingAttr">
                    <option value="">Not specified</option>
                    <option value="OutsideHitter">Outside Hitter</option>
                    <option value="Setter">Setter</option>
                    <option value="Libero">Libero</option>
                    <option value="MiddleBlocker">Middle Blocker</option>
                    <option value="OppositeHitter">Opposite Hitter</option>
                  </select>
                </div>

                <div class="input-group">
                  <label>Dominant Hand</label>
                  <select v-model="attrForm.dominantHand" :disabled="isSavingAttr">
                    <option value="">Not specified</option>
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                    <option value="Ambidextrous">Ambidextrous</option>
                  </select>
                </div>

                <div class="input-group">
                  <label>Height (cm)</label>
                  <input type="number" v-model="attrForm.heightCm" placeholder="e.g. 195" min="50" max="250" :disabled="isSavingAttr" />
                </div>

                <div class="input-group">
                  <label>Weight (kg)</label>
                  <input type="number" v-model="attrForm.weightKg" placeholder="e.g. 85" min="30" max="200" step="0.1" :disabled="isSavingAttr" />
                </div>

                <div class="input-group">
                  <label>Spike Reach (cm)</label>
                  <input type="number" v-model="attrForm.spikeReachCm" placeholder="e.g. 345" min="100" max="400" :disabled="isSavingAttr" />
                </div>

                <div class="input-group">
                  <label>Block Reach (cm)</label>
                  <input type="number" v-model="attrForm.blockReachCm" placeholder="e.g. 320" min="100" max="400" :disabled="isSavingAttr" />
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-cancel" @click="cancelEditAttr" :disabled="isSavingAttr">Cancel</button>
                <button class="btn-save" @click="saveAttributes" :disabled="isSavingAttr">
                  {{ isSavingAttr ? 'Saving...' : 'Save Data' }}
                </button>
              </div>
           </div>

           <div v-else-if="!hasAttributes" class="attr-empty">
             <p>This user hasn't shared their physical data yet.</p>
             <button v-if="isMyProfile" @click="startEditAttr" class="btn-outline">
               Add Attributes
             </button>
           </div>

           <div v-else class="attr-grid">
             <div class="attr-box" v-if="formatPosition(currentAttr.position)">
               <span class="attr-label">Position</span>
               <span class="attr-val">{{ formatPosition(currentAttr.position) }}</span>
             </div>

             <div class="attr-box" v-if="formatHand(currentAttr.dominantHand)">
               <span class="attr-label">Dominant Hand</span>
               <span class="attr-val">{{ formatHand(currentAttr.dominantHand) }}</span>
             </div>

             <div class="attr-box" v-if="currentAttr.heightCm">
               <span class="attr-label">Height</span>
               <span class="attr-val">{{ currentAttr.heightCm }} <span class="attr-unit">cm</span></span>
             </div>

             <div class="attr-box" v-if="currentAttr.weightKg">
               <span class="attr-label">Weight</span>
               <span class="attr-val">{{ currentAttr.weightKg }} <span class="attr-unit">kg</span></span>
             </div>

             <div class="attr-box" v-if="currentAttr.spikeReachCm">
               <span class="attr-label">Spike Reach</span>
               <span class="attr-val">{{ currentAttr.spikeReachCm }} <span class="attr-unit">cm</span></span>
             </div>

             <div class="attr-box" v-if="currentAttr.blockReachCm">
               <span class="attr-label">Block Reach</span>
               <span class="attr-val">{{ currentAttr.blockReachCm }} <span class="attr-unit">cm</span></span>
             </div>
           </div>
        </div>

        <div v-if="isMyProfile" class="card chart-card">
           <h3 class="section-title">Salary Distribution</h3>
           <div class="chart-box">
              <SalaryPiechart />
           </div>
        </div>

        <div class="card clubs-card">
          <h3 class="section-title">{{ isMyProfile ? 'My Clubs' : 'Clubs & Teams' }}</h3>
          
          <div v-if="myClubs.length === 0" class="empty-clubs">
            <p>{{ isMyProfile ? 'You are not a member of any club yet.' : 'User is not a member of any club.' }}</p>
          </div>

          <div v-else class="clubs-wrapper">
            <div class="clubs-list">
              <div 
                v-for="club in paginatedClubs" 
                :key="club.clubId" 
                class="club-item"
              >
                <div class="club-avatar-mini">
                  {{ club.clubName ? club.clubName.charAt(0).toUpperCase() : 'C' }}
                </div>
                
                <div class="club-details">
                  <h4 class="club-name">{{ club.clubName }}</h4>
                  <span class="club-role">{{ club.role || 'Member' }}</span>
                </div>
                
                <button class="view-btn" @click="goToClub(club.clubId)">
                  Go to club →
                </button>
              </div>
            </div>

            <div class="pagination-footer" v-if="totalClubsPages > 1">
              <button 
                class="page-btn" 
                :disabled="clubsPage === 1" 
                @click="changeClubsPage(clubsPage - 1)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <span class="page-info">Page {{ clubsPage }} of {{ totalClubsPages }}</span>
              <button 
                class="page-btn" 
                :disabled="clubsPage === totalClubsPages" 
                @click="changeClubsPage(clubsPage + 1)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      <div class="grid-row grid-bottom mt-4">
        
        <div class="card chart-card activity-card">
           <h3 class="section-title">Activity Trend (Last 6 Months)</h3>
           <div class="chart-box">
              <Spinner v-if="isTrendsLoading" />
              <ActivityBarChart 
                 v-else
                 :labels="trendLabels" 
                 :tasksTrend="trendTasks" 
                 :matchesTrend="trendMatches" 
              />
           </div>
        </div>
        <div class="card stats-card">
           <h3 class="section-title">Career Overview</h3>
           <div class="stats-list">
              <div class="stat-item">
                 <div class="stat-icon bg-blue-light">🏐</div>
                 <div class="stat-info">
                    <span class="stat-label">Matches Played</span>
                    <strong class="stat-value">{{ matchesPlayed }}</strong>
                 </div>
              </div>
              <div class="stat-item">
                 <div class="stat-icon bg-green-light">✅</div>
                 <div class="stat-info">
                    <span class="stat-label">Tasks Finished</span>
                    <strong class="stat-value">{{ tasksFinished }}</strong>
                 </div>
              </div>
              <div class="stat-item">
                 <div class="stat-icon bg-yellow-light">🎯</div>
                 <div class="stat-info">
                    <span class="stat-label">Completion Rate</span>
                    <strong class="stat-value">{{ taskCompletionRate }}%</strong>
                 </div>
              </div>
           </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 95%;
  margin: 0 auto;
  font-family: 'Segoe UI', sans-serif;
  color: #1f2937;
  padding-bottom: 40px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.mt-4 {
  margin-top: 20px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.card-header-flex .section-title {
  margin-bottom: 0;
}

.btn-text {
  background: none;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0;
}
.btn-text:hover {
  text-decoration: underline;
}

.state-box {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  border: 1px dashed #e5e7eb;
}

.state-box.error {
    color: #ef4444;
    background: #fef2f2;
    border-color: #fca5a5;
}

.grid-row {
  display: grid;
  grid-template-columns: 1fr; 
  gap: 20px;
  align-items: stretch;
}

@media (min-width: 1024px) {
  .grid-top-3 {
    grid-template-columns: 1fr 1.2fr 1.2fr; 
  }
  
  .grid-top-2 {
    grid-template-columns: 1.2fr 2fr; 
  }

  .grid-bottom {
    grid-template-columns: 2fr 1.2fr; 
  }
}

.chart-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 380px; 
}

.chart-box {
  flex: 1; 
  position: relative; 
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-chart {
  align-items: flex-end; 
  justify-content: space-around;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
  box-sizing: border-box;
}

.placeholder-bar {
  width: 10%;
  background-color: #e5e7eb;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}

.attr-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 380px;
}

.attr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  align-content: start; 
  flex: 1;
}

.attr-box {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.attr-box:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.attr-box::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #3b82f6; 
  border-radius: 4px 0 0 4px;
}

.attr-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  font-weight: 600;
}

.attr-val {
  font-size: 1.15rem;
  color: #0f172a;
  font-weight: 800;
  line-height: 1.2;
}

.attr-unit {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
  margin-left: 2px;
}

.attr-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  padding: 40px 20px;
  color: #64748b;
  font-size: 0.95rem;
}

.btn-outline {
  margin-top: 15px;
  padding: 8px 20px;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  background: transparent;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover {
  background: #eff6ff;
}

.attr-form {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (min-width: 1024px) {
  .form-grid { grid-template-columns: 1fr 1fr 1fr; }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.input-group input, 
.input-group select {
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  background: #f8fafc;
  font-size: 0.95rem;
  transition: all 0.2s;
}
.input-group input:focus, 
.input-group select:focus {
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-save {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 8px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clubs-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 380px; 
}

.clubs-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.empty-clubs {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

.clubs-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-content: start; 
  min-height: 320px; 
}

.club-item {
  display: flex;
  align-items: center;
  padding: 16px; 
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px; 
  transition: all 0.2s ease;
  height: 96px;
  box-sizing: border-box;
}

.club-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.club-avatar-mini {
  width: 52px; 
  height: 52px;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.4rem; 
  margin-right: 14px;
  flex-shrink: 0;
}

.club-details {
  flex: 1;
  min-width: 0; 
}

.club-name {
  margin: 0 0 6px 0;
  font-size: 1.05rem; 
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-role {
  font-size: 0.85rem;
  font-weight: 500;
  color: #3b82f6;
  background-color: #eff6ff;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.view-btn {
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #eee; 
  border-radius: 8px;
  color: #333; 
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer; 
  transition: all 0.2s; 
  white-space: nowrap;
  margin-left: auto;
}

.view-btn:hover { 
  background-color: #007bff; 
  color: white; 
  border-color: #007bff; 
}

.pagination-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: auto; 
  padding-top: 20px;
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
  border-color: var(--blue, #3b82f6);
  color: var(--blue, #3b82f6);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8fafc;
}

.page-info {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}


.stats-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white; 
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-color: #cbd5e1;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem; 
  margin-right: 14px;
  background-color: #f1f5f9;
  color: #64748b;
  opacity: 0.85; 
  filter: grayscale(30%);
}

.bg-blue-light, .bg-green-light, .bg-yellow-light {
  background: #f1f5f9; 
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.4rem;
  color: #0f172a;
  font-weight: 800;
  line-height: 1.2;
}
</style>
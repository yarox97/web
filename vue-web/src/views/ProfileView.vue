<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getAvatar } from '@/utils/getAvatar';
import { useExternalProfile } from '@/modules/profile/composables/useExternalProfile';
import SalaryPiechart from '@/components/profile/SalaryPiechart.vue';
import Spinner from '@/components/shared/Spinner.vue';
import ProfileHeader from '@/modules/profile/components/ProfileHeader.vue';

const route = useRoute();
const authStore = useAuthStore();

const isMyProfile = computed(() => {
  return route.path.includes('/profile/me') || 
         route.params.username === authStore.user?.userName;
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

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="profile-container">
    
    <div v-if="authStore.isLoading || isLoadingExternal" class="state-box">
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
      ></ProfileHeader>

      <div class="charts-row">
        
        <div class="card chart-card">
           <h3 class="chart-title">Salary Distribution</h3>
           <div class="chart-content">
              <SalaryPiechart />
           </div>
        </div>

        <div class="card chart-card">
           <h3 class="chart-title">Activity Overview</h3>
           <div class="chart-content placeholder-chart">
              <div class="placeholder-bar" style="height: 40%"></div>
              <div class="placeholder-bar" style="height: 70%"></div>
              <div class="placeholder-bar" style="height: 50%"></div>
              <div class="placeholder-bar" style="height: 80%"></div>
              <div class="placeholder-bar" style="height: 30%"></div>
              <div class="placeholder-bar" style="height: 60%"></div>
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

.charts-row {
  display: grid;
  grid-template-columns: 1fr; 
  gap: 20px;
}

.chart-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chart-title {
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.chart-content {
  flex: 1;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
  height: 300px;
}

.placeholder-bar {
  width: 10%;
  background-color: #e5e7eb;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}

@media (min-width: 768px) {
  .charts-row {
    grid-template-columns: 1fr 1fr; 
  }
}
</style>
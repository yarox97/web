<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getAvatar } from '@/utils/getAvatar';
import { useExternalProfile } from '@/modules/profile/composables/useExternalProfile';

// Компоненты
import SalaryPiechart from '@/components/profile/SalaryPiechart.vue';
import Spinner from '@/components/shared/Spinner.vue';
import ProfileHeader from '@/modules/profile/components/ProfileHeader.vue';

const route = useRoute();
const authStore = useAuthStore();

// Определяем, смотрит ли пользователь свой профиль
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
  } else {
    await fetchProfile();
  }
};

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
      
      <div class="charts-row" :class="{ 'single-col': !isMyProfile }">
        
        <div v-if="isMyProfile" class="card chart-card">
           <h3 class="chart-title">Salary Distribution</h3>
           <div class="chart-box">
              <SalaryPiechart />
           </div>
        </div>

        <div class="card chart-card">
           <h3 class="chart-title">Activity Overview</h3>
           <div class="chart-box placeholder-chart">
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

/* --- СЕТКА ГРАФИКОВ --- */
.charts-row {
  display: grid;
  /* На мобильных устройствах элементы идут друг под другом (1 колонка) */
  grid-template-columns: 1fr; 
  gap: 20px;
}

@media (min-width: 768px) {
  .charts-row {
    /* На десктопе: 1 часть (33%) и 2 части (66%) */
    grid-template-columns: 1fr 2fr; 
  }

  /* Если мы смотрим чужой профиль и графика зарплаты нет,
     растягиваем оставшийся график на всю ширину */
  .charts-row.single-col {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 450px; 
}

.chart-title {
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
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
</style>
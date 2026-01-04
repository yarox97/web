<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import SalaryPiechart from '@/components/Profile/SalaryPiechart.vue';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const userAvatar = computed(() => {
  if (user.value?.avatarUrl) return user.value.avatarUrl;
  const name = `${user.value?.firstName || ''} ${user.value?.lastName || ''}`.trim() || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`;
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-En', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

</script>

<template>
  <div class="profile-container">
    
    <div v-if="authStore.isLoading" class="state-box">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!user" class="state-box">
      <p>Profile not found.</p>
    </div>

    <div v-else class="profile-wrapper">
      
      <div class="card profile-header">
        <div class="header-bg"></div>
        <div class="header-content">
          <div class="avatar-container">
            <img :src="userAvatar" alt="Avatar" class="avatar-img" />
          </div>
          
          <div class="user-details">
            <h1 class="full-name">{{ user.firstName }} {{ user.lastName }}</h1>
            <p class="username">@{{ user.userName }}</p>
            
            <div class="meta-info">
              <div v-if="user.email" class="meta-row">
                <div class="icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <span>{{ user.email }}</span>
              </div>

              <div v-if="user.createdAt" class="meta-row">
                <div class="icon-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <span>Registration: {{ formatDate(user.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Layout --- */
.profile-container {
  max-width: 95%;
  margin: 0 auto;
  font-family: 'Segoe UI', sans-serif;
  color: #1f2937;
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

/* --- Header Styles --- */
.profile-header {
  margin-bottom: 30px;
}

.header-bg {
  height: 130px;
  background: linear-gradient(120deg, #0ea5e9, #2563eb);
}

.header-content {
  display: flex;
  flex-direction: column; /* Mobile first: колонка */
  align-items: center;    /* Центрируем всё */
  margin-top: -65px;      /* Поднимаем контент на фон */
  padding: 0 20px 30px;
}

.avatar-container {
  position: relative;
  z-index: 2;
  margin-bottom: 15px;
}

.avatar-img {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  border: 5px solid #fff;
  object-fit: cover;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.user-details {
  text-align: center;
  width: 100%;
}

.full-name {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.username {
  margin: 5px 0 15px;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center; /* Центрируем мета-инфо на мобилке */
}

.meta-row {
  display: flex;
  align-items: center; /* ВАЖНО: Выравниваем иконку и текст по центру */
  gap: 10px;
  color: #4b5563;
  font-size: 0.95rem;
}

.icon-box {
  display: flex; /* Чтобы SVG внутри не прыгал */
  align-items: center;
  color: #9ca3af;
}

/* --- Clubs Styles --- */
.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
  padding-left: 5px;
  color: #374151;
}

.clubs-grid {
  max-width: 70%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.club-card {
  display: flex;
  justify-content: space-between;
  align-items: center; /* ВАЖНО: Бейдж всегда по центру вертикали */
  padding: 20px 24px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.club-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.club-name {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.join-date {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-primary { background-color: #eff6ff; color: #1d4ed8; }
.badge-success { background-color: #f0fdf4; color: #15803d; }
.badge-gray    { background-color: #f3f4f6; color: #374151; }

/* --- Loading Spinner --- */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* --- Desktop Version (Media Query) --- */
@media (min-width: 768px) {
  .clubs-grid {
    grid-template-columns: repeat(2, 1fr); /* Две колонки на ПК */
  }

  .header-content {
    flex-direction: row; /* В ряд */
    align-items: flex-end; /* Текст прижат к низу аватарки */
    text-align: left; /* Текст слева */
    padding: 0 30px 30px;
    gap: 30px; /* Отступ между аватаркой и текстом */
  }

  .avatar-container {
    margin-bottom: 0; /* Убираем отступ снизу у аватарки */
  }

  .user-details {
    padding-bottom: 10px; /* Небольшая коррекция, чтобы текст был ровно */
    text-align: left;
  }
  
  .meta-info {
    align-items: flex-start; /* Выравниваем иконки по левому краю */
    flex-direction: row; /* На ПК мета-инфо можно в строку (опционально) */
    gap: 20px;
  }
}
</style>
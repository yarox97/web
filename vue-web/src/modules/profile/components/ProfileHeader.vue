<script setup>
import { formatDate } from '@/utils/dateFormater';
import { computed } from 'vue';

defineProps(['user', 'avatar'])

</script>

<template>
    <div class="card profile-header">
        <div class="header-bg"></div>
        <div class="header-content">
          <div class="avatar-container">
            <img :src="avatar" alt="Avatar" class="avatar-img" />
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
</template>

<style scoped>

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.profile-header {
  margin-bottom: 20px;
}

.header-bg {
  height: 130px;
  background: linear-gradient(120deg, #0ea5e9, #2563eb);
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -65px;
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
  align-items: center;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4b5563;
  font-size: 0.95rem;
}

.icon-box {
  display: flex;
  align-items: center;
  color: #9ca3af;
}

@media (min-width: 768px) {
  .header-content {
    flex-direction: row;
    align-items: flex-end;
    text-align: left;
    padding: 0 30px 30px;
    gap: 30px;
  }

  .avatar-container {
    margin-bottom: 0;
  }

  .user-details {
    padding-bottom: 10px;
    text-align: left;
  }
  
  .meta-info {
    align-items: flex-start;
    flex-direction: row;
    gap: 20px;
  }
}
</style>
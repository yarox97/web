<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const emit = defineEmits(['close-sidebar']);

const avatar = computed(() => authStore.userAvatar) 

const fullName = computed(() => {
  if (authStore.user) {
    return `${authStore.user.firstName || ''} ${authStore.user.lastName || ''}`.trim() || 'User'
  }
  return 'Guest'
})

const menuItems = computed(() => [
  {
    name: 'Notifications',
    path: '/app/cockpit',
    icon: 'bell',
    badge: notificationStore.unreadCount
  },
  {
    name: 'Calendar',
    path: '/app/calendar',
    icon: 'calendar'
  },
  {
    name: 'Tasks',     
    path: '/app/tasks',
    icon: 'check-square'
  },
  {
    name: 'Contracts',
    path: '/app/contracts',
    icon: 'file-text'
  },
  {
    name: 'Clubs',
    path: '/app/clubs',
    icon: 'users'
  }
])

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed', error);
  }
};

const closeOnMobile = () => {
  if (window.innerWidth <= 768) {
    emit('close-sidebar');
  }
};

onMounted(() => {
  notificationStore.fetchUnreadCount();
})
</script>

<template>
  <div class="sidebar-inner"> 
    
    <div class="sidebar-header">
      <button class="close-btn" @click="$emit('close-sidebar')" aria-label="Close Sidebar">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <router-link to="profile" class="user-link">
    <div class="user-section">
      <div class="avatar-wrapper">
        <img :src="avatar" alt="User Avatar" class="avatar-img" />
      </div>
      <div class="user-info">
        <span class="user-name">{{ fullName }}</span>
      </div>
    </div>
    </router-link>

    <div class="scroll-area">
      <nav class="nav-menu">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path" 
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
          @click="closeOnMobile" 
        >
          <div class="icon-box">
            <svg v-if="item.icon === 'bell'" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            
            <svg v-if="item.icon === 'calendar'" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            
            <svg v-if="item.icon === 'users'" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            
            <svg v-if="item.icon === 'check-square'" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>

            <svg v-if="item.icon === 'file-text'" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>

            <span v-if="item.badge > 0" class="badge">{{ item.badge }}</span>
          </div>
          <span class="link-text">{{ item.name }}</span>
        </router-link>
      </nav>
    </div>

    <div class="logout-section">
      <button @click="handleLogout" class="nav-item logout-btn" aria-label="Log Out">
        <div class="icon-box">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </div>
        <span class="link-text">Log out</span>
      </button>
    </div>

  </div>
</template>

<style scoped>
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f0f2f5;
  padding: 20px 15px;
  color: #1f2937;
  font-family: 'Segoe UI', sans-serif;
  box-sizing: border-box;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.close-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 5px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 10px;
  flex-shrink: 0;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-link {
  text-decoration: none;
  color: inherit;
}

.scroll-area {
  flex-grow: 1;
  overflow-y: auto; 
  margin-bottom: 10px;
  scrollbar-width: thin; 
  scrollbar-color: #cbd5e1 transparent;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 15px;
  border-radius: 12px;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 1rem;
  flex-shrink: 0;
}

.nav-item:hover {
  background-color: #e5e7eb;
  color: #000;
}

.nav-item.router-link-active {
  background-color: #fff;
  color: #0ea5e9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.icon-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
}

.badge {
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  height: 16px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fff;
  box-sizing: border-box;
}

.logout-section {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.logout-btn:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

@media (max-width: 768px) {
  .close-btn {
    display: block;
  }
}
</style>
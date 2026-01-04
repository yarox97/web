<template>
  <div class="home-wrapper">
    <div class="home-grid">
      
      <div class="list-panel">
        
        <div class="notifications-scroll-area">
          <div v-if="loading" class="state-message">Loading...</div>
          
          <div v-else-if="notifications.length === 0" class="state-message">
            No new notifications
          </div>
          
          <div
            v-else
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-card"
            :class="{ 
              'is-read': notification.isChecked,
              'is-active': selectedNotification?.id === notification.id 
            }"
            @click="handleNotificationClick(notification)"
          >
            <div class="card-header">
              <span class="category-badge" :class="getCategoryClass(notification.notificationCategory)">
                {{ notification.notificationCategory }}
              </span>
              <span class="date">{{ formatDate(notification.createdAt) }}</span>
            </div>
            
            <div class="card-body">
              <p class="notification-text text-ellipsis">{{ notification.text }}</p>
            </div>
          </div>
        </div>

        <div class="pagination-footer">
          <button 
            class="page-btn"
            @click="changePage(pagination.pageNumber - 1)" 
            :disabled="pagination.pageNumber === 1 || loading"
          >
            ←
          </button>

          <span class="page-info">
            Page {{ pagination.pageNumber }}
          </span>

          <button 
            class="page-btn"
            @click="changePage(pagination.pageNumber + 1)"
            :disabled="pagination.pageNumber >= pagination.totalPages || loading"
          >
            →
          </button>
        </div>

      </div>

      <div class="detail-panel desktop-only">
        <div v-if="selectedNotification" class="detail-content">
          <div class="detail-header">
            <h2>Details</h2>
            <span class="date">{{ formatDate(selectedNotification.createdAt) }}</span>
          </div>
          
          <div class="detail-body">
            <span class="category-badge" :class="getCategoryClass(selectedNotification.notificationCategory)">
              {{ selectedNotification.notificationCategory }}
            </span>
            
            <p class="full-text">{{ selectedNotification.text }}</p>
            
            <div v-if="selectedNotification.payload" class="payload-box">
              <pre>{{ selectedNotification.payload }}</pre>
            </div>
          </div>

          <div v-if="selectedNotification.linkedURL" class="detail-actions">
            <a :href="selectedNotification.linkedURL" target="_blank" class="btn-primary">
              Follow link
            </a>
          </div>
        </div>
        
        <div v-else class="empty-selection">
          <p>Choose a notification to show..</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, api } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const notifications = ref([])
const loading = ref(false)
const selectedNotification = ref(null)

const pagination = ref({ 
  pageNumber: 1, 
  pageSize: 10, 
  totalPages: 1 
})


const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isChecked).length
})


const handleNotificationClick = async (notification) => {
  const isMobile = window.innerWidth < 768

  if (!notification.isChecked) {
    notification.isChecked = true; 
    
    notificationStore.decrementUnread(); 

    try {
      await api.put(`/api/notification/user/notifications/${notification.id}`)
    } catch (e) {
      console.error("Failed to mark as read", e);
      notification.isChecked = false;
      notificationStore.setUnreadCount(notificationStore.unreadCount + 1);
    }
  }

  if (isMobile) {
    router.push({ name: 'NotificationDetails', params: { id: notification.id } })
  } else {
    selectedNotification.value = notification
  }
}

const changePage = async (newPage) => {
  if (newPage < 1 || newPage > pagination.value.totalPages) return;
  
  pagination.value.pageNumber = newPage; 
  await loadNotifications(); 
}

const loadNotifications = async () => {
  loading.value = true;
  try {
    const response = await api.get('/api/notification/user/notifications', {
      params: { 
        pageNumber: pagination.value.pageNumber, 
        pageSize: pagination.value.pageSize 
      }
    });
    
    notifications.value = response.data.items || [];
    
    pagination.value.totalPages = response.data.totalPages; 
    pagination.value.totalCount = response.data.totalCount;

  } catch (e) {
    console.error(e);
    console.error(response.data.message)
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  loadNotifications();
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-EN', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit' }) : ''

const getCategoryClass = (cat) => {
  if (cat === 'Informative') return 'badge-blue'
  if (cat === 'Alert') return 'badge-red'
  return 'badge-gray'
}
</script>

<style scoped>
.home-wrapper {
  padding: 20px;
  height: 92vh; 
  box-sizing: border-box;
  background-color: var(--gray, #f4f6f8);
  border-radius: 16px;
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  height: 100%;
}

.list-panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notifications-scroll-area {
  flex: 1;              
  overflow-y: auto;   
}

.pagination-footer {
  padding: 10px 16px;
  border-top: 1px solid #eee;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-btn {
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 12px;
  color: #666;
}

.state-message {
  padding: 20px;
  text-align: center;
  color: #888;
}

.notification-card {
  min-height: 10%;
  padding: 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: background 0.2s;
}
.notification-card:hover { background-color: #fafafa; }

.notification-card:not(.is-read) { background-color: #f0f7ff; border-left-color: #007bff; }
.notification-card.is-active { background-color: #e3f2fd; border-left-color: #1976d2; }

.category-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
.badge-blue { background: #e3f2fd; color: #1565c0; }
.badge-red { background: #ffebee; color: #c62828; }
.badge-gray { background: #f5f5f5; color: #616161; }

.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.detail-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
}
.desktop-only { display: none; }

.full-text { font-size: 16px; line-height: 1.6; color: #333; }
.payload-box { background: #f5f5f5; padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 12px; overflow-x: auto; }
.btn-primary { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; }
.empty-selection { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }

@media (min-width: 768px) {
  .home-grid { grid-template-columns: 400px 1fr; }
  .desktop-only { display: block; }
}
</style>
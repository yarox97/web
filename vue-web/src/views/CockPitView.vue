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
              <div class="header-left">
                <span class="category-badge" :class="getCategoryClass(notification.notificationCategory)">
                  {{ formatCategory(notification.notificationCategory) }}
                </span>
                <span class="date">{{ formatDate(notification.createdAt) }}</span>
              </div>
              
              <button class="delete-notification" @click.stop="deleteNotification(notification.id)" title="Delete notification">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="card-body">
              <p class="notification-text text-ellipsis">{{ notification.text }}</p>
            </div>
          </div>
        </div>
        <div class="pagination-footer">
          <button class="page-btn" @click="changePage(pagination.pageNumber - 1)" :disabled="pagination.pageNumber === 1 || loading">←</button>
          <span class="page-info">Page {{ pagination.pageNumber }}</span>
          <button class="page-btn" @click="changePage(pagination.pageNumber + 1)" :disabled="pagination.pageNumber >= pagination.totalPages || loading">→</button>
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
              {{ formatCategory(selectedNotification.notificationCategory) }}
            </span>
            
            <p class="full-text">{{ selectedNotification.text }}</p>
            
            <div v-if="currentPayload" class="dynamic-actions-area">
              
              <div v-if="selectedNotification.notificationCategory === 'ClubJoinRequest'" class="action-block">
                <div class="info-row">
                  <strong>Candidate:</strong> {{ currentPayload.SenderName }} {{ currentPayload.SenderSurname }}
                </div>
                <div class="info-row">
                  <strong>Club:</strong> {{ currentPayload.ClubName }}
                </div>
                <button class="action-btn btn-primary" @click="goToClubRequests(currentPayload.ClubId)">
                  Manage Join Requests
                </button>
              </div>

              <div v-else-if="selectedNotification.notificationCategory === 'ClubJoinApproved'" class="action-block success-block">
                <p>Congratulations! You are now a member of <strong>{{ currentPayload.ClubName }}</strong>.</p>
                <button class="action-btn btn-success" @click="goToClub(currentPayload.ClubId)">
                  Go to Club Page
                </button>
              </div>

              <div v-else-if="selectedNotification.notificationCategory === 'ClubJoinRejected'" class="action-block error-block">
                 <p>Unfortunately, your request to join <strong>{{ currentPayload.ClubName }}</strong> was declined.</p>
                 <button class="action-btn btn-outline" @click="goToAllClubs">
                  Find other clubs
                </button>
              </div>

            </div>

            </div>

          <div v-if="selectedNotification.linkedURL && !currentPayload" class="detail-actions">
            <a :href="selectedNotification.linkedURL" target="_blank" class="btn-primary">
              Follow link
            </a>
          </div>
        </div>
        
        <div v-else class="empty-selection">
          <p>Choose a notification to show details</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore} from '@/stores/authStore'
import api from '@/services/api'
import { useNotificationStore } from '@/stores/notificationStore'
import { formatDate } from '@/utils/dateFormater'

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

const currentPayload = computed(() => {
  if (!selectedNotification.value || !selectedNotification.value.payload) {
    return null;
  }
  try {
    return JSON.parse(selectedNotification.value.payload);
  } catch (e) {
    console.error("Error parsing payload JSON", e);
    return null;
  }
})

const goToClubRequests = (clubId) => {
  router.push({ name: 'ClubManage', params: { id: clubId }, query: { tab: 'requests' } })
}

const goToClub = (clubId) => {
  router.push({ name: 'Club', params: { id: clubId } })
}

const goToAllClubs = () => {
  router.push('clubs')
}

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
    // На мобилке нужно передать ID и там тоже сделать парсинг
    router.push({ name: 'NotificationDetails', params: { id: notification.id } })
  } else {
    selectedNotification.value = notification
  }
}

const deleteNotification = async (id) => {
  if (!confirm('Are you sure?')) return;
  try {
    await api.delete(`/api/notification/user/notifications/${id}`)

    notifications.value = notifications.value.filter(n => n.id !== id);
    loadNotifications();
    
    if (selectedNotification.value && selectedNotification.value.id === id) {
      selectedNotification.value = null
    }
  }
  catch(error){
    console.error("Error deleting notification:", error)
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
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  loadNotifications();
})

const formatCategory = (cat) => {
  if (!cat) return '';
  return cat.replace(/([A-Z])/g, ' $1').trim(); 
}

const getCategoryClass = (cat) => {
  if (cat === 'ClubJoinRequest') return 'badge-blue';
  if (cat === 'ClubJoinRejected') return 'badge-red';
  if (cat === 'ClubJoinApproved') return 'badge-green';
  
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
  padding: 12px 16px; /* Немного уменьшил вертикальные отступы */
  border-bottom: 1px solid #eee;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: background 0.2s;
}
.notification-card:hover { background-color: #fafafa; }

.notification-card:not(.is-read) { background-color: #f0f7ff; border-left-color: #007bff; }
.notification-card.is-active { background-color: #e3f2fd; border-left-color: #1976d2; }

/* --- ИЗМЕНЕНИЯ В СТИЛЯХ КАРТОЧКИ --- */

/* Добавил флекс для хедера карточки, чтобы выровнять элементы */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

/* Группируем бейдж и дату слева */
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date {
  font-size: 12px;
  color: #999;
}

/* Новые стили для кнопки удаления */
.delete-notification {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  color: #9ca3af; /* Светло-серый по умолчанию */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: auto; /* Прижимает кнопку вправо */
  margin-right: -8px; /* Компенсация padding-right родителя для визуального выравнивания */
}

.delete-notification svg {
  width: 18px;
  height: 18px;
}

.delete-notification:hover {
  background-color: #fee2e2; /* Светло-красный фон при наведении */
  color: #ef4444; /* Красная иконка при наведении */
}

/* ---------------------------------- */

.category-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; }
.badge-blue { background: #e3f2fd; color: #1565c0; }
.badge-red { background: #ffebee; color: #c62828; }
.badge-green { background: #e8f5e9; color: #2e7d32; }
.badge-gray { background: #f5f5f5; color: #616161; }

.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px; color: #333;}

.detail-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
}
.desktop-only { display: none; }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-header h2 { margin: 0; }

.full-text { font-size: 16px; line-height: 1.6; color: #333; }
.payload-box { background: #f5f5f5; padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 12px; overflow-x: auto; }
.btn-primary { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; }
.empty-selection { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }

.category-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 8px; display: inline-block; }
.badge-blue { background: #e3f2fd; color: #1565c0; }
.badge-red { background: #ffebee; color: #c62828; }
.badge-green { background: #e8f5e9; color: #2e7d32; }
.badge-gray { background: #f5f5f5; color: #616161; }

/* НОВЫЕ СТИЛИ ДЛЯ БЛОКОВ ДЕЙСТВИЙ */
.dynamic-actions-area {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.action-block {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #eee;
}

.success-block { background-color: #f1f8e9; border-color: #c5e1a5; }
.error-block { background-color: #ffebee; border-color: #ffcdd2; }

.info-row {
  margin-bottom: 10px;
  color: #555;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s;
  width: 100%; 
}

.action-btn:active { transform: scale(0.98); }
.btn-primary { background: #007bff; color: white; }
.btn-success { background: #4caf50; color: white; }
.btn-outline { background: transparent; border: 1px solid #ccc; color: #333; }
.btn-primary:hover { background: #0056b3; }

@media (min-width: 768px) {
  .home-grid { grid-template-columns: 400px 1fr; }
  .desktop-only { display: block; }
  .action-btn { width: auto; }
}
</style>
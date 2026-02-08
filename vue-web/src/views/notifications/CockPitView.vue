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
            
            <div v-if="currentPayload && currentPayloadComponent" class="dynamic-actions-area">
              <component 
                :is="currentPayloadComponent" 
                :payload="currentPayload" 
              />
            </div>

            <div v-if="selectedNotification.linkedURL && !currentPayload" class="detail-actions">
              <a :href="selectedNotification.linkedURL" target="_blank" class="btn btn-primary">
                Follow link
              </a>
            </div>
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
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore} from '@/stores/authStore'
import api from '@/services/api'
import { useNotificationStore } from '@/stores/notificationStore'
import { formatDate } from '@/utils/dateFormater'

// --- ИМПОРТ НОВЫХ КОМПОНЕНТОВ ---
import ClubJoinRequest from '@/modules/notifications/ClubJoinRequest.vue'
import ClubJoinApproved from '@/modules/notifications/ClubJoinApproved.vue'
import ClubJoinRejected from '@/modules/notifications/ClubJoinRejected.vue'
import ContractAssigned from '@/modules/notifications/ContractAssigned.vue'
import KickedFromClubByClub from '@/modules/notifications/KickedFromClubByClub.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// --- СЛОВАРЬ КОМПОНЕНТОВ ---
const notificationComponents = {
  'ClubJoinRequest': ClubJoinRequest,
  'ClubJoinApproved': ClubJoinApproved,
  'ClubJoinRejected': ClubJoinRejected,
  'ContractAssigned': ContractAssigned,
  'KickedFromClubByClub': KickedFromClubByClub
  // Добавьте новые типы сюда
}

// --- STATE ---
const notifications = ref([])
const loading = ref(false)
const selectedNotification = ref(null)

const pagination = ref({ 
  pageNumber: 1, 
  pageSize: 10, 
  totalPages: 1 
})

// --- COMPUTED ---
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

// Вычисляем, какой компонент рендерить
const currentPayloadComponent = computed(() => {
  if (!selectedNotification.value) return null
  const category = selectedNotification.value.notificationCategory
  return notificationComponents[category] || null
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isChecked).length
})

// --- METHODS ---

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

const deleteNotification = async (id) => {
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

const categoryLabels = {
  'ClubJoinRequest': 'Join Request',       
  'ClubJoinApproved': 'Approved',          
  'ClubJoinRejected': 'Declined',          
  'ContractAssigned': 'New Contract',     
  'KickedFromClubByClub': 'Membership Revoked', 
  'Informative': 'Info',
  'Alert': 'System Alert'
}

const formatCategory = (cat) => {
  if (!cat) return '';
  
  if (categoryLabels[cat]) {
    return categoryLabels[cat];
  }

  return cat.replace(/([A-Z])/g, ' $1').trim(); 
}

const getCategoryClass = (cat) => {
  if (['ClubJoinRequest', 'Informative'].includes(cat)) return 'badge-blue';
  if (['ClubJoinRejected', 'Alert', 'KickedFromClubByClub'].includes(cat)) return 'badge-red';
  if (['ClubJoinApproved'].includes(cat)) return 'badge-green';
  if (['ContractAssigned'].includes(cat)) return 'badge-purple';
  return 'badge-gray'
}
</script>

<style scoped>
/* --- ОСНОВНАЯ РАЗМЕТКА (ОСТАЛАСЬ ПРЕЖНЕЙ) --- */
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
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: background 0.2s;
}
.notification-card:hover { background-color: #fafafa; }

.notification-card:not(.is-read) { background-color: #f0f7ff; border-left-color: #007bff; }
.notification-card.is-active { background-color: #e3f2fd; border-left-color: #1976d2; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date {
  font-size: 12px;
  color: #999;
}

.delete-notification {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: auto;
  margin-right: -8px;
}

.delete-notification svg {
  width: 18px;
  height: 18px;
}

.delete-notification:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.category-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; display: inline-block; }
.badge-blue { background: #e3f2fd; color: #1565c0; }
.badge-red { background: #ffebee; color: #c62828; }
.badge-green { background: #e8f5e9; color: #2e7d32; }
.badge-gray { background: #f5f5f5; color: #616161; }
.badge-purple { background: #f3e8ff; color: #7e22ce; } /* New */

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
.empty-selection { display: flex; align-items: center; justify-content: center; height: 100%; color: #999; }
.dynamic-actions-area { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }

:deep(.notification-body) {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: #fff;
  transition: all 0.2s;
}

:deep(.icon-area) {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.icon-area svg) {
  width: 20px;
  height: 20px;
}

:deep(.content-area) { flex: 1; }
:deep(.title) {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
:deep(.description) {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
}
:deep(.highlight) { font-weight: 600; color: #111; }
:deep(.meta-info) { font-size: 12px; color: #6b7280; display: block; margin-top: 4px; }

:deep(.actions) { display: flex; gap: 10px; flex-wrap: wrap; }
:deep(.btn) {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  text-decoration: none;
  display: inline-block;
}
:deep(.btn:hover) { opacity: 0.9; }

:deep(.request-theme) { background-color: #f0f9ff; border-color: #bae6fd; }
:deep(.request-theme .icon-area) { background-color: #e0f2fe; color: #0284c7; }
:deep(.btn-primary) { background-color: #0284c7; color: white; }

:deep(.success-theme) { background-color: #f0fdf4; border-color: #bbf7d0; }
:deep(.success-theme .icon-area) { background-color: #dcfce7; color: #16a34a; }
:deep(.btn-success) { background-color: #16a34a; color: white; }

:deep(.error-theme) { background-color: #fef2f2; border-color: #fecaca; }
:deep(.error-theme .icon-area) { background-color: #fee2e2; color: #dc2626; }
:deep(.btn-outline-danger) { background: transparent; border: 1px solid #dc2626; color: #dc2626; }
:deep(.btn-outline-danger:hover) { background: #dc2626; color: white; opacity: 1; }

:deep(.contract-theme) { background-color: #faf5ff; border-color: #e9d5ff; }
:deep(.contract-theme .icon-area) { background-color: #f3e8ff; color: #9333ea; }
:deep(.btn-purple) { background-color: #9333ea; color: white; }

:deep(.warning-theme) { background-color: #fff7ed; border-color: #ffedd5; }
:deep(.warning-theme .icon-area) { background-color: #ffedd5; color: #ea580c; }
:deep(.btn-outline-warning) { background: transparent; border: 1px solid #ea580c; color: #ea580c; }
:deep(.btn-outline-warning:hover) { background: #ea580c; color: white; opacity: 1; }

@media (min-width: 768px) {
  .home-grid { grid-template-columns: 400px 1fr; }
  .desktop-only { display: block; }
}
</style>
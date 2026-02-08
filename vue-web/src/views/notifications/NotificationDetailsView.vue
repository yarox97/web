<template>
  <div class="details-wrapper">
    <header class="details-nav">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to notifications
      </button>
    </header>

    <div v-if="loading" class="state-message">
      Loading details...
    </div>

    <div v-else-if="error" class="state-message error-text">
      {{ error }}
      <button class="action-btn btn-outline" style="margin-top: 10px;" @click="goBack">Go Back</button>
    </div>

    <div v-else-if="notification" class="content-card">
      <div class="card-header">
        <div class="header-top">
          <span class="category-badge" :class="getCategoryClass(notification.notificationCategory)">
            {{ formatCategory(notification.notificationCategory) }}
          </span>
          <span class="date">{{ formatDate(notification.createdAt) }}</span>
        </div>
        
        <button class="delete-notification" @click="deleteAndGoBack" title="Delete notification">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="3 6 5 6 21 6"></polyline>
             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
           </svg>
        </button>
      </div>

      <div class="card-body">
        
        <div v-if="sender" class="sender-section">
            <div class="sender-avatar">
                <img :src="sender.avatarUrl || 'https://ui-avatars.com/api/?name=' + sender.firstName + '+' + sender.lastName" alt="Sender Avatar" />
            </div>
            <div class="sender-info-text">
                <span class="sender-label">From:</span>
                <span class="sender-name">{{ sender.firstName }} {{ sender.lastName }}</span>
            </div>
        </div>

        <h3 class="notification-title" v-if="notification.subject">{{ notification.subject }}</h3>
        
        <p class="full-text">{{ notification.text }}</p>

        <div v-if="currentPayload && currentPayloadComponent" class="dynamic-actions-area">
          <component 
            :is="currentPayloadComponent" 
            :payload="currentPayload" 
          />
        </div>

        <div v-if="notification.linkedURL && !currentPayload" class="detail-actions">
           <a :href="notification.linkedURL" target="_blank" class="action-btn btn-primary link-btn">
             Follow link
           </a>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { formatDate } from '@/utils/dateFormater'
import { useNotificationStore } from '@/stores/notificationStore'

// 1. ИМПОРТ МОДУЛЕЙ (Те же, что и в списке)
import ClubJoinRequest from '@/modules/notifications/ClubJoinRequest.vue'
import ClubJoinApproved from '@/modules/notifications/ClubJoinApproved.vue'
import ClubJoinRejected from '@/modules/notifications/ClubJoinRejected.vue'
import ContractAssigned from '@/modules/notifications/ContractAssigned.vue'
import KickedFromClubByClub from '@/modules/notifications/KickedFromClubByClub.vue'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

const notification = ref(null)
const sender = ref(null)
const loading = ref(true)
const error = ref(null)

const notificationId = route.params.id

// 2. СЛОВАРЬ КОМПОНЕНТОВ
const notificationComponents = {
  'ClubJoinRequest': ClubJoinRequest,
  'ClubJoinApproved': ClubJoinApproved,
  'ClubJoinRejected': ClubJoinRejected,
  'ContractAssigned': ContractAssigned,
  'KickedFromClubByClub': KickedFromClubByClub
}

// 3. СЛОВАРЬ КРАСИВЫХ НАЗВАНИЙ
const categoryLabels = {
  'ClubJoinRequest': 'Join Request',
  'ClubJoinApproved': 'Approved',
  'ClubJoinRejected': 'Declined',
  'ContractAssigned': 'New Contract',
  'KickedFromClubByClub': 'Membership Revoked',
  'Informative': 'Info',
  'Alert': 'System Alert'
}

// --- Computed Properties ---

const currentPayload = computed(() => {
  if (!notification.value || !notification.value.payload) return null;
  try {
    return JSON.parse(notification.value.payload);
  } catch (e) {
    console.error("Error parsing payload JSON", e);
    return null;
  }
})

// Выбор компонента для рендера
const currentPayloadComponent = computed(() => {
  if (!notification.value) return null
  const category = notification.value.notificationCategory
  return notificationComponents[category] || null
})

// --- Navigation Actions ---

const goBack = () => {
  router.back()
}
// Функции типа goToClub больше не нужны здесь, они внутри компонентов

// --- Data Operations ---

const fetchNotification = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.get(`/api/notification/user/notifications/${notificationId}`)
    notification.value = response.data
    
    // Загрузка отправителя
    const senderLogin = notification.value.senderUserName || notification.value.senderLogin;
    if (senderLogin) {
        try {
            const userResponse = await api.get(`/api/user/users/${encodeURIComponent(senderLogin)}`)
            sender.value = userResponse.data
        } catch (err) {
            console.warn(`Failed to fetch sender details`, err)
        }
    }

    if (!notification.value.isChecked) {
        markAsRead()
    }
  } catch (e) {
    console.error(e)
    error.value = "Failed to load notification details."
  } finally {
    loading.value = false
  }
}

const markAsRead = async () => {
    try {
      await api.put(`/api/notification/user/notifications/${notificationId}`)
      notification.value.isChecked = true
      notificationStore.decrementUnread() 
    } catch(e) {
        console.error("Mark read failed", e)
    }
}

const deleteAndGoBack = async () => {
    if (!confirm('Delete this notification?')) return;
    try {
        await api.delete(`/api/notification/user/notifications/${notificationId}`)
        goBack()
    } catch (e) {
        alert("Failed to delete notification")
    }
}

// --- Formatters ---

const formatCategory = (cat) => {
  if (!cat) return '';
  return categoryLabels[cat] || cat.replace(/([A-Z])/g, ' $1').trim(); 
}

const getCategoryClass = (cat) => {
  if (['ClubJoinRequest', 'Informative'].includes(cat)) return 'badge-blue';
  if (['ClubJoinRejected', 'Alert', 'KickedFromClubByClub'].includes(cat)) return 'badge-red';
  if (['ClubJoinApproved'].includes(cat)) return 'badge-green';
  if (['ContractAssigned'].includes(cat)) return 'badge-purple';
  return 'badge-gray'
}

onMounted(() => {
    fetchNotification()
})
</script>

<style scoped>
.details-wrapper {
  padding: 16px;
  background-color: var(--gray, #f4f6f8);
  min-height: 92vh;
  box-sizing: border-box;
  border-radius: 16px;
}

.home-wrapper {
  padding: 20px;
  height: 92vh; 
  box-sizing: border-box;
  background-color: var(--gray, #f4f6f8);
  
}

.details-nav { margin-bottom: 20px; }

.back-btn {
  background: none; border: none; display: flex; align-items: center; gap: 8px;
  font-size: 16px; color: #555; cursor: pointer; padding: 0; font-weight: 500;
}
.back-btn:hover { color: #007bff; }

.content-card {
  background: white; border-radius: 12px; border: 1px solid #e0e0e0;
  padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.card-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;
}

.header-top { display: flex; flex-direction: column; gap: 8px; }

/* SENDER STYLES */
.sender-section {
    display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
    padding: 12px; background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 8px;
}
.sender-avatar img {
    width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd;
}
.sender-info-text { display: flex; flex-direction: column; }
.sender-label { font-size: 11px; text-transform: uppercase; color: #999; font-weight: 600; margin-bottom: 2px; }
.sender-name { font-size: 14px; font-weight: 600; color: #333; }

.date { font-size: 13px; color: #999; }
.full-text { font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px; white-space: pre-wrap; }

.state-message { text-align: center; padding: 40px; color: #888; }
.error-text { color: #d32f2f; }

.delete-notification {
    background: white; border: 1px solid #eee; cursor: pointer; padding: 8px;
    border-radius: 8px; color: #9ca3af; display: flex; transition: all 0.2s;
}
.delete-notification:hover { background-color: #fee2e2; color: #ef4444; border-color: #fecaca;}

/* BADGES */
.category-badge { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; display: inline-block; width: fit-content; }
.badge-blue { background: #e3f2fd; color: #1565c0; }
.badge-red { background: #ffebee; color: #c62828; }
.badge-green { background: #e8f5e9; color: #2e7d32; }
.badge-gray { background: #f5f5f5; color: #616161; }
.badge-purple { background: #f3e8ff; color: #7e22ce; }

.dynamic-actions-area { margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }

/* СТИЛИ ДЛЯ ВНУТРЕННИХ КОМПОНЕНТОВ (Если нужны глобально, или используйте deep) */
/* Мы используем deep, чтобы стилизовать контент внутри <component> */
:deep(.notification-body) {
  display: flex; gap: 16px; padding: 16px; border-radius: 12px;
  border: 1px solid transparent; background: #fff; transition: all 0.2s;
}
:deep(.icon-area) {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
:deep(.icon-area svg) { width: 20px; height: 20px; }
:deep(.content-area) { flex: 1; }
:deep(.title) { margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1f2937; }
:deep(.description) { margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #4b5563; }
:deep(.highlight) { font-weight: 600; color: #111; }
:deep(.actions) { display: flex; gap: 10px; flex-wrap: wrap; }
:deep(.btn) {
  padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; transition: opacity 0.2s; text-decoration: none; display: inline-block;
}
:deep(.btn:hover) { opacity: 0.9; }

/* Темы компонентов (цвета) */
:deep(.request-theme) { background-color: #f0f9ff; border-color: #bae6fd; }
:deep(.request-theme .icon-area) { background-color: #e0f2fe; color: #0284c7; }
:deep(.btn-primary) { background-color: #0284c7; color: white; }

:deep(.success-theme) { background-color: #f0fdf4; border-color: #bbf7d0; }
:deep(.success-theme .icon-area) { background-color: #dcfce7; color: #16a34a; }
:deep(.btn-success) { background-color: #16a34a; color: white; }

:deep(.error-theme) { background-color: #fef2f2; border-color: #fecaca; }
:deep(.error-theme .icon-area) { background-color: #fee2e2; color: #dc2626; }
:deep(.btn-outline-danger) { background: transparent; border: 1px solid #dc2626; color: #dc2626; }

:deep(.contract-theme) { background-color: #faf5ff; border-color: #e9d5ff; }
:deep(.contract-theme .icon-area) { background-color: #f3e8ff; color: #9333ea; }
:deep(.btn-purple) { background-color: #9333ea; color: white; }

:deep(.warning-theme) { background-color: #fff7ed; border-color: #ffedd5; }
:deep(.warning-theme .icon-area) { background-color: #ffedd5; color: #ea580c; }
:deep(.btn-outline-warning) { background: transparent; border: 1px solid #ea580c; color: #ea580c; }

@media (min-width: 768px) {
    .details-wrapper { padding: 40px; display: flex; flex-direction: column; align-items: center; }
    .content-card, .details-nav { width: 100%; max-width: 600px; }
}
</style>
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content content-animate">
      <div class="modal-header">
        <div class="user-profile">
          <img :src="getAvatar(receiver.fullName)" class="modal-avatar" />
          <div class="user-text">
            <h3>{{ receiver.fullName }}</h3>
            <p>{{ taskTitle }}</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="status-banner" :class="getStatusClass(receiver.taskStatus)">
          Status: {{ formatStatus(receiver.taskStatus) }}
        </div>

        <h4 class="responses-title">Response History</h4>
        
        <div v-if="receiver.responses?.length > 0" class="responses-list">
          <div v-for="response in receiver.responses" :key="response.id" class="response-card">
            <div class="response-time">{{ formatDateTime(response.createdAt) }}</div>
            <div class="response-text" v-if="response.text">{{ response.text }}</div>
            
            <div v-if="response.attachments?.length > 0" class="response-files">
              <a v-for="file in response.attachments" :key="file.url" :href="file.url" target="_blank" class="file-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                {{ file.fileName }}
              </a>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-responses">
          No messages or files have been submitted by this user yet.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getAvatar } from '@/utils/getAvatar'
import { formatDate } from '@/utils/dateFormater'

const props = defineProps({
  receiver: Object,
  taskTitle: String
})

defineEmits(['close'])

const formatStatus = (s) => s // Добавьте вашу логику маппинга если нужно
const getStatusClass = (status) => {
  const s = String(status).toLowerCase()
  if (s === 'completed' || s === '1') return 'st-success'
  if (s === 'failed' || s === '2') return 'st-danger'
  return 'st-warning'
}

const formatDateTime = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-content {
  background: white; width: 90%; max-width: 600px; border-radius: 20px;
  max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
  padding: 20px; border-bottom: 1px solid #f1f5f9;
  display: flex; justify-content: space-between; align-items: center;
}
.user-profile { display: flex; align-items: center; gap: 12px; }
.modal-avatar { width: 48px; height: 48px; border-radius: 50%; }
.user-text h3 { margin: 0; font-size: 1.1rem; }
.user-text p { margin: 0; font-size: 0.85rem; color: #64748b; }

.modal-body { padding: 20px; overflow-y: auto; }
.status-banner {
  padding: 10px; border-radius: 8px; text-align: center; font-weight: 700; margin-bottom: 20px;
}
.st-success { background: #dcfce7; color: #166534; }
.st-danger { background: #fee2e2; color: #991b1b; }
.st-warning { background: #fef3c7; color: #92400e; }

.responses-title { font-size: 0.9rem; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }
.response-card { 
  background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}
.response-time { font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px; }
.response-text { font-size: 0.95rem; color: #334155; line-height: 1.5; }
.response-files { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
.file-link { 
  font-size: 0.85rem; color: #0ea5e9; text-decoration: none; 
  display: flex; align-items: center; gap: 4px;
}
.empty-responses { text-align: center; color: #94a3b8; padding: 40px 0; }
.close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; }
</style>
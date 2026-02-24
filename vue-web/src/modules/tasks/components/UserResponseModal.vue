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

      <div v-if="canManageTask && !isFinalStatus" class="modal-footer">
        
        <div v-if="receiver.hasActiveContract" class="penalty-toggle">
          <label class="checkbox-label">
            <input type="checkbox" v-model="applyPenalty" />
            <span class="checkbox-text">Apply penalty/premia</span>
          </label>
        </div>
        
        <div v-else class="penalty-info">
          <span class="info-icon">ⓘ</span> User has no active contract. Financial adjustments unavailable.
        </div>

        <div class="footer-actions">
          <button 
            class="btn-action btn-return" 
            @click="handleReturn" 
            :disabled="isProcessing"
          >
            <span v-if="!isProcessing">↩ Return</span>
            <span v-else>...</span>
          </button>

          <button 
            class="btn-action btn-confirm" 
            @click="handleConfirm('Confirmed')" 
            :disabled="isProcessing"
          >
            <span v-if="!isProcessing">✓ Confirm</span>
            <span v-else>...</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getAvatar } from '@/utils/getAvatar'
import tasksService from '@/modules/tasks/services/taskService'

const props = defineProps({
  receiver: { type: Object, required: true },
  taskTitle: { type: String, default: '' },
  canManageTask: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'refresh'])

const isProcessing = ref(false)
const applyPenalty = ref(false)

const isFinalStatus = computed(() => {
  const s = String(props.receiver.taskStatus)
  return s === 'Confirmed' || s === 'Failed' 
})

const formatStatus = (s) => s 

const getStatusClass = (status) => {
  const s = String(status).toLowerCase()
  if (s === 'completed' || s === 'confirmed') return 'st-success'
  if (s === 'failed' || s === 'overdued') return 'st-danger'
  if (s === 'returned') return 'st-returned'
  return 'st-warning'
}

const formatDateTime = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })

// --- ЛОГИКА КНОПОК ---

const handleReturn = async () => {
  if (!confirm("Return this task to the user?")) return;
  
  isProcessing.value = true;
  try {
    await tasksService.returnUserTask(props.receiver.userTaskId);
    emit('refresh'); 
    emit('close');   
  } catch (e) {
    console.error(e);
    alert("Failed to return task.");
  } finally {
    isProcessing.value = false;
  }
}

const handleConfirm = async (finalStatus) => {
  const actionName = finalStatus === 'Confirmed' ? 'confirm' : 'fail';
  if (!confirm(`Are you sure you want to ${actionName} this task?`)) return;

  isProcessing.value = true;
  try {
    // Если контракта нет, всегда отправляем applyPenalty = false, даже если каким-то чудом чекбокс был нажат
    const shouldApplyPenalty = props.receiver.hasActiveContract ? applyPenalty.value : false;
    
    await tasksService.confirmUserTask(props.receiver.userTaskId, finalStatus, shouldApplyPenalty);
    emit('refresh');
    emit('close');
  } catch (e) {
    console.error(e);
    alert(`Failed to ${actionName} task.`);
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
  padding: 20px; box-sizing: border-box;
}
.modal-content {
  background: white; width: 100%; max-width: 600px; border-radius: 16px;
  max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.modal-header {
  padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
}
.user-profile { display: flex; align-items: center; gap: 16px; }
.modal-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #f1f5f9; }
.user-text h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.user-text p { margin: 0; font-size: 0.9rem; color: #64748b; margin-top: 2px;}

.modal-body { padding: 24px; overflow-y: auto; flex: 1; }

/* Status Styles */
.status-banner {
  padding: 12px; border-radius: 8px; text-align: center; font-weight: 700; margin-bottom: 24px; font-size: 0.95rem;
}
.st-success { background: #dcfce7; color: #166534; }
.st-danger { background: #fee2e2; color: #991b1b; }
.st-warning { background: #fef3c7; color: #92400e; }
.st-returned { background: #ffedd5; color: #9a3412; }

/* Responses */
.responses-title { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 12px; font-weight: 700; }
.response-card { 
  background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}
.response-time { font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; }
.response-text { font-size: 0.95rem; color: #334155; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;}
.response-files { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px; }
.file-link { 
  font-size: 0.85rem; color: #0284c7; text-decoration: none; 
  display: flex; align-items: center; gap: 6px; background: white;
  padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; transition: all 0.2s;
}
.file-link:hover { border-color: #0284c7; background: #f0f9ff; }
.empty-responses { text-align: center; color: #94a3b8; padding: 40px 0; font-style: italic; }

.close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 4px; transition: all 0.2s; }
.close-btn:hover { color: #0f172a; background: #f1f5f9; }

/* Footer & Actions */
.modal-footer {
  padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #fff; display: flex; flex-direction: column; gap: 16px;
}

.penalty-toggle {
  background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px dashed #cbd5e1;
}
.penalty-info {
  background: #f1f5f9; padding: 12px 16px; border-radius: 8px; color: #64748b; font-size: 0.85rem; font-style: italic; display: flex; align-items: center; gap: 8px;
}
.info-icon { font-style: normal; font-weight: bold; color: #94a3b8; }

.checkbox-label {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-primary, #007bff);
}
.checkbox-text {
  font-size: 0.9rem; font-weight: 600; color: #334155;
}

.footer-actions {
  display: flex; gap: 12px;
}
.btn-action {
  flex: 1; padding: 10px 12px; border-radius: 8px; font-weight: 600; font-size: 0.9rem;
  border: none; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-return { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.btn-return:hover:not(:disabled) { background: #ffedd5; border-color: #fdba74; }

.btn-fail { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2;}
.btn-fail:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; }

.btn-confirm { background: var(--color-primary, #007bff); color: white; }
.btn-confirm:hover:not(:disabled) { opacity: 0.9; }

.btn-action:disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(0.5); }

.content-animate { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

/* Mobile */
@media (max-width: 600px) {
  .modal-content { width: 100%; height: 100%; max-height: 100%; border-radius: 0; }
  .footer-actions { flex-direction: column; }
}
</style>
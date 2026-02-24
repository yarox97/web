<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card content-animate">
      <div class="modal-header">
        <h3>Manage Receivers</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="modal-body" v-if="!loading">
        <div class="receivers-section">
          <div class="quick-select">
            <button type="button" class="btn-tiny" @click="selectAll">Select All</button>
            <button type="button" class="btn-tiny btn-clear" @click="selectedIds = []">Clear</button>
          </div>
          
          <div class="members-list">
            <div v-if="availableMembers.length === 0" class="empty-state">
              No other members found in this club.
            </div>
            <label v-for="member in availableMembers" :key="member.userId" class="member-checkbox">
              <input type="checkbox" :value="member.userId" v-model="selectedIds">
              <div class="member-info">
                <span class="member-name">{{ member.fullName || member.userName }}</span>
                <span class="member-role">{{ member.role }}</span>
              </div>
            </label>
          </div>
          <small v-if="selectedIds.length === 0" class="error-text">Please select at least one receiver.</small>
        </div>
      </div>
      <div v-else class="loading-box">
        <Spinner />
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')" :disabled="isSaving">Cancel</button>
        <button class="btn-primary" @click="save" :disabled="isSaving || selectedIds.length === 0">
          {{ isSaving ? 'Saving...' : 'Save Receivers' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'
import tasksService from '@/modules/tasks/services/taskService'
import Spinner from '@/components/shared/Spinner.vue'

const props = defineProps({
  clubId: { type: String, required: true },
  taskId: { type: String, required: true },
  currentIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'updated'])
const authStore = useAuthStore()

const loading = ref(true)
const isSaving = ref(false)
const members = ref([])
const selectedIds = ref([...props.currentIds])

// Фильтруем список: убираем самого себя из выбора получателей
const availableMembers = computed(() => {
  const currentUserId = authStore.user?.id;
  // Фильтруем, чтобы ID не совпадал с текущим пользователем
  return members.value.filter(m => 
    String(m.userId).toLowerCase() !== String(currentUserId).toLowerCase()
  );
})

const fetchMembers = async () => {
  try {
    const response = await api.get(`/api/${props.clubId}/members`)
    members.value = response.data.map(m => {
      const u = m.user || m.User || m;
      return {
        userId: m.userId || m.UserId || u.id || u.Id,
        userName: m.userName || m.UserName || u.userName,
        fullName: `${m.userFirstName || u.firstName || ''} ${m.userSurname || u.lastName || ''}`.trim(),
        role: m.role || m.Role || 'Member'
      }
    })
  } catch (e) {
    console.error("Failed to load members", e)
  } finally {
    loading.value = false
  }
}

const selectAll = () => {
  // Выбираем только доступных (себя не добавляем)
  selectedIds.value = availableMembers.value.map(m => m.userId)
}

const save = async () => {
  isSaving.value = true
  try {
    // ВАЖНО: Service должен отправлять объект { newReceiverIds: [...] }
    await tasksService.updateTaskReceivers(props.taskId, selectedIds.value)
    emit('updated')
  } catch (e) {
    console.error(e)
    alert(e.response?.data?.message || "Failed to update receivers")
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.checkAuth();
  }
  fetchMembers();
})
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s; padding: 20px; box-sizing: border-box; backdrop-filter: blur(2px); }
.modal-card { background: white; border-radius: 16px; width: 500px; max-width: 100%; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; font-size: 1.25rem; color: #0f172a; font-weight: 700; }

.close-btn { background: none; border: none; color: #64748b; cursor: pointer; transition: color 0.2s; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 4px; }
.close-btn:hover { color: #0f172a; background: #f1f5f9; }

.modal-body { padding: 0; overflow: hidden; display: flex; flex-direction: column; flex: 1; }
.loading-box { min-height: 200px; display: flex; justify-content: center; align-items: center; }

/* Receivers Section */
.receivers-section { display: flex; flex-direction: column; height: 100%; }

.quick-select { display: flex; gap: 10px; padding: 16px 24px; border-bottom: 1px solid #f1f5f9; background: #fff; }
.btn-tiny { background: white; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
.btn-tiny:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }
.btn-clear { color: #ef4444; border-color: #fca5a5; }
.btn-clear:hover { background: #fef2f2; border-color: #ef4444; }

.members-list { flex: 1; overflow-y: auto; padding: 16px 24px; background: #f8fafc; display: flex; flex-direction: column; gap: 8px; }

.member-checkbox { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 10px 12px; border-radius: 8px; transition: all 0.2s; background: white; border: 1px solid #e2e8f0; }
.member-checkbox:hover { border-color: var(--color-primary, #007bff); transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.member-checkbox:has(input:checked) { border-color: var(--color-primary, #007bff); background: #f0f7ff; }

.member-checkbox input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--color-primary, #007bff); margin: 0; }

.member-info { display: flex; align-items: center; justify-content: space-between; flex: 1; width: 100%; }
.member-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
.member-role { font-size: 0.7rem; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #e2e8f0; }

.empty-state { text-align: center; color: #94a3b8; font-style: italic; padding: 20px; }
.error-text { color: #ef4444; font-size: 0.85rem; font-weight: 600; text-align: center; padding: 10px; background: #fef2f2; border-top: 1px solid #fee2e2; }

.modal-footer { padding: 20px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background: white; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; }

.btn-primary { background: var(--color-primary, #007bff); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-secondary:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }

.content-animate { animation: scaleIn 0.2s ease-out; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
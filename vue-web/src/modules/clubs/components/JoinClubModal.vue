<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps(['isOpen'])
const emit = defineEmits(['close', 'joined'])

const authStore = useAuthStore()
const loadingJoin = ref(false)
const joinForm = ref({ joinCode: '' })
const errorMessage = ref('')

const closeModal = () => {
  joinForm.value.joinCode = ''
  errorMessage.value = ''
  emit('close')
}

const submitJoinForm = async () => {
  errorMessage.value = ''
  if (!joinForm.value.joinCode) return
  
  loadingJoin.value = true
  try {
    await api.post('/api/joinClubRequests', { joinCode: joinForm.value.joinCode })
    // Обновляем данные пользователя и сообщаем родителю об успехе
    await authStore.checkAuth()
    emit('joined') 
    closeModal()
  } catch (error) {
    const serverMessage = error.response?.data?.message || error.response?.data || 'Error joining club'
    errorMessage.value = typeof serverMessage === 'string' ? serverMessage : 'Invalid code'
  } finally {
    loadingJoin.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Join a Club</h2>
          <button class="close-icon" @click="closeModal">×</button>
        </div>
        <p class="modal-desc">Enter the invite code provided by the club administrator.</p>
        <form @submit.prevent="submitJoinForm">
          <div class="form-group">
            <label>Invite Code</label>
            <input 
              v-model="joinForm.joinCode" 
              placeholder="Ex: KPS-8821" 
              required 
              class="modal-input"
              :class="{ 'input-error': errorMessage }"
            />
          </div>
          <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="loadingJoin">
              {{ loadingJoin ? 'Joining...' : 'Join Club' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.overlay {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 90%; max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}

.modal-header h2 { margin: 0; font-size: 20px; }

.close-icon {
  background: none; border: none;
  font-size: 24px; cursor: pointer; color: #888;
}

.modal-desc {
  font-size: 14px; color: #666;
  margin-bottom: 20px; line-height: 1.5;
}

.form-group { margin-bottom: 20px; }
.form-group label {
  display: block; font-size: 13px; font-weight: 600;
  margin-bottom: 6px; color: #333;
}

.modal-input {
  width: 100%; padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 16px; outline: none;
  transition: border 0.2s;
}

.modal-input:focus { border-color: #007bff; }

.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

.btn-cancel {
  padding: 10px 16px; background: transparent;
  border: 1px solid #ddd; border-radius: 8px;
  cursor: pointer; font-weight: 500;
}

.btn-submit {
  padding: 10px 20px; background: #007bff; color: white;
  border: none; border-radius: 8px;
  cursor: pointer; font-weight: 600;
}
.btn-submit:disabled { background: #ccc; cursor: not-allowed; }

.error-alert {
  background-color: #ffebee; color: #c62828;
  padding: 10px; border-radius: 8px;
  font-size: 13px; margin-bottom: 15px;
  display: flex; align-items: center;
  border: 1px solid #ffcdd2;
}

.input-error { border-color: #c62828 !important; background-color: #fffafa; }
</style>
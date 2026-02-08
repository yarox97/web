<script setup>
import { ref, computed, reactive } from 'vue';
import { formatDate } from '@/utils/dateFormater'; 
import api from '@/services/api'; 

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  canEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['user-updated']);

// --- STATE ---
const isEditing = ref(false);
const isSaving = ref(false);

const form = reactive({
  firstName: '',
  lastName: '',
  email: ''
});

const errors = reactive({
  firstName: '',
  lastName: '',
  email: ''
});

// --- COMPUTED ---
const displayName = computed(() => {
  const u = props.user;
  if (!u) return 'Unknown';
  if (u.firstName || u.lastName) {
    return `${u.firstName || ''} ${u.lastName || ''}`.trim();
  }
  return u.userName;
});

// --- METHODS ---
const startEdit = () => {
  form.firstName = props.user.firstName || '';
  form.lastName = props.user.lastName || '';
  form.email = props.user.email || '';
  clearErrors();
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  clearErrors();
};

const clearErrors = () => {
  errors.firstName = '';
  errors.lastName = '';
  errors.email = '';
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const saveChanges = async () => {
  clearErrors();
  let hasError = false;

  if (!form.firstName.trim()) {
    errors.firstName = 'First name is required';
    hasError = true;
  }
  if (!form.lastName.trim()) {
    errors.lastName = 'Last name is required';
    hasError = true;
  }
  if (!form.email || !validateEmail(form.email)) {
    errors.email = 'Valid email is required';
    hasError = true;
  }

  if (hasError) return;

  isSaving.value = true;

  try {
    const promises = [];
    const isPrimaryChanged = 
      form.firstName !== (props.user.firstName || '') || 
      form.lastName !== (props.user.lastName || '');

    if (isPrimaryChanged) {
      const primaryPayload = {
        userId: props.user.id,
        Name: form.firstName,
        Surname: form.lastName
      };
      promises.push(api.put('/api/user/modify-primary', primaryPayload));
    }

    if (form.email !== props.user.email) {
      promises.push(api.put(
        '/api/user/modify-email', 
        JSON.stringify(form.email), 
        { headers: { 'Content-Type': 'application/json' } }
      ));
    }

    if (promises.length === 0) {
      isEditing.value = false;
      isSaving.value = false;
      return;
    }

    // Ждем завершения запросов
    await Promise.all(promises);
    
    // 1. Сообщаем родителю (на всякий случай)
    emit('user-updated'); 
    
    // 2. Закрываем форму
    isEditing.value = false;

    // 3. ПЕРЕЗАГРУЖАЕМ СТРАНИЦУ
    // Это обновит все данные приложения
    window.location.reload();

  } catch (error) {
    console.error("Update failed", error);
    if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.errors) {
             const findError = (key) => data.errors[key] || data.errors[key.toLowerCase()] || data.errors[key.charAt(0).toUpperCase() + key.slice(1)];
             const emailErr = findError('Email');
             const firstErr = findError('FirstName');
             const lastErr = findError('LastName');

             if (emailErr) errors.email = emailErr[0];
             if (firstErr) errors.firstName = firstErr[0];
             if (lastErr) errors.lastName = lastErr[0];
        } else if (data.code && data.message) {
             alert(`Error (${data.code}): ${data.message}`);
        } else {
             alert("Error: " + (data.detail || "Failed to save changes."));
        }
    } else {
        alert("Network error or server is unreachable.");
    }
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="card profile-header">
    <div class="header-bg"></div>
    
    <div class="header-content">
      <div class="avatar-container">
        <img :src="avatar || '/default-avatar.png'" alt="Avatar" class="avatar-img" />
      </div>
      
      <div class="user-details">
        
        <transition name="fade" mode="out-in">
          <div v-if="!isEditing" class="view-mode" key="view">
            <div class="info-top">
              <h1 class="full-name">{{ displayName }}</h1>
              
              <button v-if="canEdit" class="btn-modify" @click="startEdit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
            </div>
            
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
                <span>Joined: {{ formatDate(user.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="edit-mode" key="edit">
            <div class="edit-panel">
              <div class="panel-header">
                <h3>Update Profile</h3>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>First Name</label>
                  <input 
                    v-model="form.firstName" 
                    type="text" 
                    class="edit-input" 
                    :class="{ 'input-error': errors.firstName }"
                    placeholder="First Name" 
                    :disabled="isSaving"
                  />
                  <span v-if="errors.firstName" class="error-msg">{{ errors.firstName }}</span>
                </div>
                
                <div class="form-group">
                  <label>Last Name</label>
                  <input 
                    v-model="form.lastName" 
                    type="text" 
                    class="edit-input" 
                    :class="{ 'input-error': errors.lastName }"
                    placeholder="Last Name" 
                    :disabled="isSaving"
                  />
                  <span v-if="errors.lastName" class="error-msg">{{ errors.lastName }}</span>
                </div>
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <input 
                  v-model="form.email" 
                  type="email" 
                  class="edit-input" 
                  :class="{ 'input-error': errors.email }"
                  placeholder="name@example.com" 
                  :disabled="isSaving"
                />
                <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
              </div>

              <div class="action-buttons">
                <button class="btn btn-cancel" @click="cancelEdit" :disabled="isSaving">
                  Cancel
                </button>
                <button class="btn btn-save" @click="saveChanges" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner"></span>
                  {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </div>
        </transition>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Основной контейнер */
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
  height: 160px;
  background: linear-gradient(120deg, #0ea5e9, #2563eb);
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -40px; 
  padding: 0 20px 30px;
}

.avatar-container {
  position: relative;
  z-index: 2;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.avatar-img {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  border: 5px solid #fff;
  object-fit: cover;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.08);
}

.user-details {
  text-align: center;
  width: 100%;
}

/* Info Top */
.info-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.full-name {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

/* --- СТИЛИ КНОПКИ --- */
.btn-modify {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn-modify:hover {
  background-color: #f9fafb;
  border-color: #0ea5e9;
  color: #0ea5e9;
  transform: translateY(-1px);
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

/* --- ФОРМА --- */
.edit-mode {
  width: 100%;
  animation: slideDown 0.3s ease-out;
}

.edit-panel {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
  text-align: left;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.panel-header h3 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 15px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 20px;
}
.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.edit-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.95rem;
  background-color: #fff;
  transition: all 0.2s;
  box-sizing: border-box;
}

.edit-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.error-msg {
  font-size: 0.85rem;
  color: #ef4444;
  margin-top: 6px;
  display: block;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
}
.btn-cancel:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-save {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}
.btn-save:hover {
  filter: brightness(110%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- АДАПТИВ (Desktop) --- */
@media (min-width: 768px) {
  .header-content {
    flex-direction: row;
    align-items: flex-start;
    text-align: left;
    padding: 0 30px 30px;
    gap: 30px;
  }

  .avatar-container {
    margin-bottom: 0;
    margin-top: 0; 
  }

  .user-details {
    padding-top: 5px;
    text-align: left;
    width: 100%;
  }
  
  .info-top {
    justify-content: flex-start;
    width: 100%;
  }

  .meta-info {
    align-items: flex-start;
    flex-direction: row;
    gap: 24px;
  }
  
  .form-row {
    flex-direction: row;
  }
  
  .edit-panel {
    margin-top: 0;
    width: 100%;
    max-width: none;
  }
}
</style>
<template>
  <div class="content-wrapper">
    <div class="header-bar">
      <div class="header-left">
        <h2>My clubs</h2>
      </div>

      <div class="header-center">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery"
            class="search-input" 
            type="text" 
            placeholder="Search my clubs..."
          >
        </div>
      </div>

      <div class="header-right">
        <button v-if="isAdmin" @click="goToCreate()" class="club-button create-btn">
          + Create
        </button>
        <button class="club-button join-btn" @click="openModal">
          Join via Code
        </button>
      </div>
    </div>

    <div class="clubs-view">
      
      <div v-if="authStore.isLoading" class="loading-state">
        Loading...
      </div>

      <div v-else-if="filteredClubs.length === 0" class="empty-state">
        <div class="empty-icon">🤷‍♂</div>
        
        <div v-if="searchQuery">
           <p>Nothing found for "{{ searchQuery }}"</p>
        </div>
        
        <div v-else class="empty-content">
            <p>You are not a member of any club yet</p>
            <button class="club-button join-btn empty-action-btn" @click="openModal">
              Join a club now
            </button>
        </div>
      </div>

      <div v-else class="clubs-grid">
        <div v-for="club in filteredClubs" :key="club.clubId" class="club-card">
          <div class="card-header">
            <h3>{{ club.clubName }}</h3> 
            <span class="role-badge" :class="getRoleClass(club.role)">
              {{ club.role }}
            </span>
          </div>

          <div class="card-body">
            <p class="join-date">Joined: {{ formatDate(club.joinDate) }}</p>
          </div>
          
          <div class="card-footer">
            <button class="view-btn" @click="openClubDetails(club.clubId)">
              Go to club →
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="overlay" @click.self="closeModal">
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
            
            <div v-if="errorMessage" class="error-alert">
              {{ errorMessage }}
            </div>

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

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, api } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')

const isModalOpen = ref(false)
const loadingJoin = ref(false)
const joinForm = ref({
  joinCode: ''
})

const errorMessage = ref('') 

const goToCreate = () => {
  router.push({name: 'CreateClub'})
}

const closeModal = () => {
  isModalOpen.value = false
  joinForm.value.joinCode = ''
  errorMessage.value = ''
}

const openModal = () => {
  isModalOpen.value = true
  errorMessage.value = '' 
  joinForm.value.joinCode = ''
}

const submitJoinForm = async () => {
  errorMessage.value = ''
  
  if (!joinForm.value.joinCode) return;
  
  loadingJoin.value = true;
  try {
    await api.post('/api/joinClubRequests', { 
        joinCode: joinForm.value.joinCode 
    })

    closeModal();
    await authStore.checkAuth(); 
    
  } catch (error) {
    const serverMessage = error.response?.data?.message || error.response?.data || 'Error joining club';
    console.error('Failed to join:', serverMessage);
    
    errorMessage.value = typeof serverMessage === 'string' ? serverMessage : 'Invalid code or server error';
  } finally {
    loadingJoin.value = false;
  }
}

const isAdmin = computed(() => {
  return authStore.user?.userType === 'Admin'
})

const myClubs = computed(() => {
  return authStore.user?.clubDtos || []
})

const filteredClubs = computed(() => {
  if (!searchQuery.value) return myClubs.value
  const query = searchQuery.value.toLowerCase()
  return myClubs.value.filter(club => 
    club.clubName.toLowerCase().includes(query)
  )
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-EN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const getRoleClass = (role) => {
  if (role === 'President') return 'role-president'
  if (role === 'Admin') return 'role-admin'
  return 'role-member'
}

const openClubDetails = (id) => {
  console.log('Open club:', id)
}
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 20px;
  background-color: white;
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.search-wrapper {
  position: relative;
  width: 300px;
}
.search-icon {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  font-size: 14px; opacity: 0.5;
}
.search-input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  outline: none;
  background-color: #f9f9f9;
  box-sizing: border-box;
}
.search-input:focus { border-color: #007bff; background: white; }

.club-button {
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  margin-left: 10px;
  font-size: 13px;
  white-space: nowrap;
}
.create-btn { border: 1px solid #007bff; color: #007bff; background: white; }
.join-btn { background: #007bff; color: white; }

/* --- Content --- */
.clubs-view {
  flex: 1;
  background-color: var(--gray, #f4f6f8);
  border-radius: 16px;
  padding: 20px;
  overflow-y: auto;
}

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* --- Card --- */
.club-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}
.club-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; 
  margin-bottom: 15px;
}
.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  line-height: 1.2;
}

.role-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  margin-left: 8px;
}
.role-president { background-color: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; }
.role-admin { background-color: #e3f2fd; color: #1976d2; }
.role-member { background-color: #f5f5f5; color: #616161; }

.card-body {
  flex: 1;
  margin-bottom: 20px;
}
.join-date {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.view-btn {
  width: 100%;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.view-btn:hover {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  text-align: center;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

.empty-action-btn {
    margin-top: 15px;
    margin-left: 0;
    padding: 12px 24px;
    font-size: 16px;
    box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2);
}
.empty-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 123, 255, 0.3);
}

/* --- MOBILE  --- */
@media (max-width: 768px) {
  .header-bar {
    height: auto;
    flex-direction: column;
    padding: 15px;
    gap: 15px;
  }

  .header-left, .header-center, .header-right {
    width: 100%;
  }

  .header-left h2 {
    margin: 0;
    text-align: center;
  }

  .search-wrapper {
    width: 100%;
  }

  .header-right {
    display: flex;
    gap: 10px;
  }

  .club-button {
    flex: 1;
    margin-left: 0;
    height: 40px;
  }

  .clubs-view {
    padding: 10px;
  }

  .clubs-grid {
    grid-template-columns: 1fr;
  }
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px); 
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-icon {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
}

.modal-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.modal-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 16px;
  outline: none;
  transition: border 0.2s;
}

.modal-input:focus {
  border-color: #007bff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-submit {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-alert {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  border: 1px solid #ffcdd2;
}

.input-error {
  border-color: #c62828 !important;
  background-color: #fffafa;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
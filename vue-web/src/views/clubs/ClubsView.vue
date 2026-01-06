<template>
  <div class="content-wrapper">
    <div class="header-bar">
      <div class="header-left">
        <h2>Club Management</h2>
      </div>

      <div class="header-center">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery"
            class="search-input" 
            type="text" 
            :placeholder="activeTab === 'clubs' ? 'Search my clubs...' : 'Search requests...'"
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

    <div class="tabs-header">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'clubs' }"
        @click="activeTab = 'clubs'"
      >
        My Clubs
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'requests' }"
        @click="activeTab = 'requests'"
      >
        Sent Requests
        <span v-if="myRequests.length" class="counter-badge">{{ myRequests.length }}</span>
      </button>
    </div>

    <div class="clubs-view">
      
      <div v-if="authStore.isLoading || loadingRequests" class="loading-state">
        <Spinner></Spinner>
      </div>

      <div v-if="activeTab === 'clubs'">
        <div v-if="filteredClubs.length === 0" class="empty-state">
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
            <div class="club-avatar-wrapper">
              <img :src="getAvatarUrl(club.clubName)" alt="Club Avatar" class="club-avatar"/>
            </div>
            <div class="card-content-wrapper">
              <div class="card-header">
                <div class="title-row">
                  <h3>{{ club.clubName }}</h3> 
                  <span class="role-badge" :class="getRoleClass(club.role)">
                    {{ club.role }}
                  </span>
                </div>
              </div>
              <div class="card-body">
                <p class="join-date">Joined: {{ formatDate(club.joinDate) }}</p>
              </div>
            </div>
            <div class="card-footer">
              <button class="view-btn" @click="openClubDetails(club.clubId)">
                Go to club →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'requests'">
        <div v-if="filteredRequests.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p v-if="searchQuery">Nothing found for "{{ searchQuery }}"</p>
          <p v-else>You don't have any pending requests.</p>
        </div>

        <div v-else class="clubs-grid">
          <div v-for="req in filteredRequests" :key="req.id" class="club-card request-card">
            <div class="club-avatar-wrapper">
              <img :src="getAvatarUrl(req.clubName)" alt="Club Avatar" class="club-avatar grayscale"/>
            </div>
            
            <div class="card-content-wrapper">
              <div class="card-header">
                <div class="title-row">
                  <h3>{{ req.clubName }}</h3> 
                  <span class="status-badge" :class="getStatusClass(req.status)">
                    {{ req.status }}
                  </span>
                </div>
              </div>
              <div class="card-body">
                <p class="join-date">Sent: {{ formatDate(req.createdAt) }}</p>
              </div>
            </div>

            <div class="card-footer">
               <button v-if="req.status === 'Pending'" class="view-btn btn-cancel" @click="cancelRequest(req.id)">
                  Cancel
               </button>
               <span v-else class="status-text">
                 {{ req.status === 'Approved' ? 'You can now enter the club' : 'Request closed' }}
               </span>
            </div>
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

  </div>
</template>

<script setup>
import api from '@/services/api'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils/dateFormater'
import Spinner from '@/components/shared/Spinner.vue'

const router = useRouter()
const authStore = useAuthStore()

const searchQuery = ref('')
const activeTab = ref('clubs') // clubs | requests
const myRequests = ref([])
const loadingRequests = ref(false)

const isModalOpen = ref(false)
const loadingJoin = ref(false)
const joinForm = ref({ joinCode: '' })
const errorMessage = ref('') 

onMounted(async () => {
  await fetchMyRequests()
})

const fetchMyRequests = async () => {
  loadingRequests.value = true
  try {
    const response = await api.get('api/joinClubRequests/my')

    myRequests.value = response.data.map(req => ({
      id: req.id,
      clubId: req.clubId,
      clubName: req.clubName,
      status: req.joinClubRequestStatus, 
      createdAt: req.createdAt
    }))
    
  } catch (e) {
    console.error('Error fetching requests', e)
  } finally {
    loadingRequests.value = false
  }
}

const goToCreate = () => router.push({name: 'CreateClub'})

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
    await api.post('/api/joinClubRequests', { joinCode: joinForm.value.joinCode })
    closeModal();
    await authStore.checkAuth(); 
    await fetchMyRequests();

    activeTab.value = 'requests' 
  } catch (error) {
    const serverMessage = error.response?.data?.message || error.response?.data || 'Error joining club';
    errorMessage.value = typeof serverMessage === 'string' ? serverMessage : 'Invalid code or server error';
  } finally {
    loadingJoin.value = false;
  }
}

const cancelRequest = async (id) => {
  if(!confirm('Cancel this request?')) return;
  try {
    // await api.delete(`/api/joinClubRequests/${id}`)
    myRequests.value = myRequests.value.filter(r => r.id !== id)
  } catch (e) {
    console.error(e)
  }
}

const isAdmin = computed(() => authStore.user?.userType === 'Admin')
const myClubs = computed(() => authStore.user?.clubDtos || [])

const filteredClubs = computed(() => {
  if (!searchQuery.value) return myClubs.value
  const query = searchQuery.value.toLowerCase()
  return myClubs.value.filter(club => club.clubName.toLowerCase().includes(query))
})

const filteredRequests = computed(() => {
  if (!searchQuery.value) return myRequests.value
  const query = searchQuery.value.toLowerCase()
  return myRequests.value.filter(req => req.clubName.toLowerCase().includes(query))
})

const getAvatarUrl = (clubName) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(clubName)}&background=random&color=fff&size=128&bold=true`
}

const getRoleClass = (role) => {
  if (role === 'President') return 'role-president'
  if (role === 'Admin') return 'role-admin'
  return 'role-member'
}

const getStatusClass = (status) => {
  if (status === 'Pending') return 'status-pending'
  if (status === 'Approved') return 'status-approved'
  if (status === 'Rejected') return 'status-rejected'
  return ''
}

const openClubDetails = (id) => {
  router.push({ name: 'ClubDetails', params: { id: id } })
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
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* --- TABS --- */
.tabs-header {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 0 10px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  background: none;
  border: none;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: #007bff;
}

.tab-btn.active {
  color: #007bff;
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #007bff;
}

.counter-badge {
  background: #eee;
  color: #333;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  margin-left: 5px;
  vertical-align: middle;
}
.active .counter-badge {
  background: #e3f2fd;
  color: #007bff;
}


.search-wrapper { position: relative; width: 300px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.5; }
.search-input { width: 100%; padding: 10px 10px 10px 35px; border: 1px solid #e0e0e0; border-radius: 12px; outline: none; background-color: #f9f9f9; box-sizing: border-box; }
.search-input:focus { border-color: #007bff; background: white; }

.club-button { padding: 8px 16px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; margin-left: 10px; font-size: 13px; white-space: nowrap; }
.create-btn { border: 1px solid #007bff; color: #007bff; background: white; }
.join-btn { background: #007bff; color: white; }

.clubs-view {
  flex: 1;
  background-color: var(--gray, #f4f6f8);
  border-radius: 16px;
  padding: 20px;
  overflow-y: auto;
}

.clubs-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* --- Card --- */
.club-card {
  background: white;
  padding: 15px 20px;
  border-radius: 16px;
  border: 1px solid #eee;
  display: flex;
  flex-direction: row; 
  align-items: center; 
  transition: transform 0.2s, box-shadow 0.2s;
}
.club-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.08); }

.club-avatar-wrapper { flex-shrink: 0; margin-right: 20px; }
.club-avatar { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; }
.grayscale { filter: grayscale(100%); opacity: 0.7; }

.card-content-wrapper { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.card-header { margin-bottom: 5px; }
.title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.card-header h3 { margin: 0; font-size: 18px; color: #333; }

.role-badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; }
.role-president { background-color: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; }
.role-admin { background-color: #e3f2fd; color: #1976d2; }
.role-member { background-color: #f5f5f5; color: #616161; }

.status-badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; white-space: nowrap; }
.status-pending { background-color: #fff8e1; color: #f57c00; border: 1px solid #ffe0b2; }
.status-approved { background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
.status-rejected { background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }

.card-body { }
.join-date { font-size: 13px; color: #888; margin: 0; }

.card-footer { margin-left: 20px; text-align: right; }

.view-btn { padding: 10px 20px; background-color: #f8f9fa; border: 1px solid #eee; border-radius: 8px; color: #333; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.view-btn:hover { background-color: #007bff; color: white; border-color: #007bff; }

.btn-cancel { color: #d32f2f; background: white; border-color: #ffcdd2; }
.btn-cancel:hover { background: #ffebee; color: #b71c1c; border-color: #ef9a9a; }

.status-text { font-size: 13px; color: #666; font-style: italic; }

.empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; text-align: center; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-action-btn { margin-top: 15px; margin-left: 0; padding: 12px 24px; font-size: 16px; box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2); }
.empty-action-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0, 123, 255, 0.3); }


@media (max-width: 768px) {
  .header-bar { height: auto; flex-direction: column; padding: 15px; gap: 15px; }
  .header-left, .header-center, .header-right { width: 100%; }
  .header-left h2 { text-align: center; }
  .search-wrapper { width: 100%; }
  .header-right { display: flex; gap: 10px; }
  .club-button { flex: 1; margin-left: 0; height: 40px; }
  .clubs-view { padding: 10px; }
  .club-card { flex-direction: column; align-items: flex-start; }
  .club-avatar-wrapper { margin-bottom: 15px; margin-right: 0; width: 100%; display: flex; justify-content: center; }
  .card-content-wrapper { width: 100%; margin-bottom: 15px; text-align: center; }
  .title-row { justify-content: center; }
  .card-footer { width: 100%; margin-left: 0; text-align: center; }
  .view-btn { width: 100%; }
}

.overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease-out; }
.modal { background: white; padding: 24px; border-radius: 16px; width: 90%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: slideUp 0.3s ease-out; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.modal-header h2 { margin: 0; font-size: 20px; }
.close-icon { background: none; border: none; font-size: 24px; cursor: pointer; color: #888; }
.modal-desc { font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #333; }
.modal-input { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; box-sizing: border-box; font-size: 16px; outline: none; transition: border 0.2s; }
.modal-input:focus { border-color: #007bff; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { padding: 10px 16px; background: transparent; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-weight: 500; }
.btn-submit { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-submit:disabled { background: #ccc; cursor: not-allowed; }
.error-alert { background-color: #ffebee; color: #c62828; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 15px; display: flex; align-items: center; border: 1px solid #ffcdd2; }
.input-error { border-color: #c62828 !important; background-color: #fffafa; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
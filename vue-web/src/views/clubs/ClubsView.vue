<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import Spinner from '@/components/shared/Spinner.vue'
import JoinClubModal from '@/modules/clubs/components/JoinClubModal.vue'
import ClubCard from '@/modules/clubs/components/ClubCard.vue'
import RequestCard from '@/modules/clubs/components/RequestCard.vue'

import { useMyJoinRequests } from '@/modules/clubs/composables/useMyJoinRequests'

const router = useRouter()
const authStore = useAuthStore()

const { 
  myRequests, 
  loadingRequests, 
  fetchMyRequests, 
  cancelRequest
} = useMyJoinRequests()

const searchQuery = ref('')
const activeTab = ref('clubs')
const isModalOpen = ref(false)

const isAdmin = computed(() => authStore.user?.userType === 'Admin')
const myClubs = computed(() => authStore.user?.clubDtos || [])

const filteredClubs = computed(() => {
  if (!searchQuery.value) return myClubs.value
  return myClubs.value.filter(c => c.clubName.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const filteredRequests = computed(() => {
  if (!searchQuery.value) return myRequests.value
  return myRequests.value.filter(r => r.clubName.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const onJoinedSuccess = () => {
  fetchMyRequests()
  activeTab.value = 'requests'
}

onMounted(() => {
  fetchMyRequests()
  authStore.checkAuth(true)
})
</script>

<template>
  <div class="content-wrapper">
    
    <div class="header-bar">
      <div class="header-left"><h2>Club Management</h2></div>
      
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
        <button v-if="isAdmin" @click="router.push({name: 'CreateClub'})" class="club-button create-btn">
          + Create
        </button>
        <button class="club-button join-btn" @click="isModalOpen = true">
          Join via Code
        </button>
      </div>
    </div>

    <div class="tabs-header">
      <button class="tab-btn" :class="{ active: activeTab === 'clubs' }" @click="activeTab = 'clubs'">
        My Clubs
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
        Sent Requests
        <span v-if="myRequests.length" class="counter-badge">{{ myRequests.length }}</span>
      </button>
    </div>

    <div class="clubs-view">
      <div v-if="authStore.isLoading || loadingRequests" class="loading-state">
        <Spinner />
      </div>

      <div v-if="activeTab === 'clubs'">
        <div v-if="filteredClubs.length === 0" class="empty-state">
           <p>No clubs found.</p>
           <button class="club-button join-btn" @click="isModalOpen = true">Join a club</button>
        </div>
        <div v-else class="clubs-grid">
           <ClubCard 
             v-for="club in filteredClubs" 
             :key="club.clubId" 
             :club="club" 
           />
        </div>
      </div>

      <div v-if="activeTab === 'requests'">
        <div v-if="filteredRequests.length === 0" class="empty-state">
           <p>No requests found.</p>
        </div>
        <div v-else class="clubs-grid">
           <RequestCard 
             v-for="req in filteredRequests" 
             :key="req.id" 
             :request="req" 
             @cancel="cancelRequest"
           />
        </div>
      </div>
    </div>
    
    <JoinClubModal 
      :is-open="isModalOpen" 
      @close="isModalOpen = false"
      @joined="onJoinedSuccess"
    />
  </div>
</template>

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

.search-wrapper { position: relative; width: 300px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.5; }

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

.tab-btn:hover { color: #007bff; }

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

@media (max-width: 768px) {
  .header-bar { height: auto; flex-direction: column; padding: 15px; gap: 15px; }
  .header-left, .header-center, .header-right { width: 100%; }
  .header-left h2 { text-align: center; }
  .search-wrapper { width: 100%; }
  .header-right { display: flex; gap: 10px; }
  .club-button { flex: 1; margin-left: 0; height: 40px; }
  .clubs-view { padding: 10px; }
}
</style>
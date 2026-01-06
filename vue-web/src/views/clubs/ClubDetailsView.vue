<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/utils/dateFormater'
import { getAvatar } from '@/utils/getAvatar'
import Spinner from '@/components/shared/Spinner.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const club = ref(null)
const loading = ref(true)
const error = ref(null)
const clubId = route.params.id

// --- State ---
const activeTab = ref('overview')
const isEditing = ref(false)
const editForm = ref({})
const isSaving = ref(false)
const requests = ref([])
const loadingRequests = ref(false)
const requestFilter = ref('Pending')

// --- Permissions ---
const myClubRole = computed(() => {
  const user = authStore.user;
  if (!user || !user.clubDtos) return null;
  const myMembership = user.clubDtos.find(c => String(c.clubId) === String(clubId));
  return myMembership ? myMembership.role : null;
});

const canEdit = computed(() => ['President', 'Creator'].includes(myClubRole.value));
const canViewRequests = computed(() => ['President', 'Creator', 'Coach'].includes(myClubRole.value));

// --- API ---
const fetchClub = async () => {
  loading.value = true
  try {
    const response = await api.get(`/api/club/${clubId}`)
    club.value = response.data
  } catch (err) {
    console.error(err)
    error.value = "Failed to load club details."
  } finally {
    loading.value = false
  }
}

const startEdit = () => {
  editForm.value = {
    name: club.value.name,
    description: club.value.description,
    avatarURL: club.value.avatarURL,
    backGroundURL: club.value.backGroundURL,
    volleyBoxUrl: club.value.volleyBoxUrl || club.value.VolleyBoxUrl
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {}
}

const saveClub = async () => {
  isSaving.value = true
  try {
    await api.put(`/api/club/${clubId}`, editForm.value)
    club.value = { ...club.value, ...editForm.value }
    isEditing.value = false
    await authStore.checkAuth()
  } catch (e) {
    alert("Failed to update club details")
  } finally {
    isSaving.value = false
  }
}

const fetchRequests = async () => {
  loadingRequests.value = true
  try {
    const response = await api.get(`/api/joinClubRequests/${clubId}`)
    requests.value = response.data.map(req => {
      const user = req.requestor || {}; 
      return {
        id: req.JoinClubRequestId || req.joinClubRequestId, 
        userName: user.UserName || user.userName || 'Unknown',
        firstName: user.FirstName || user.firstName || '',
        lastName: user.LastName || user.lastName || '',
        email: user.Email || user.email || '',
        userAvatar: user.AvatarUrl || user.avatarUrl, 
        status: req.joinClubRequestStatus || 'Pending',
        createdAt: req.createdAt
      }
    })
  } catch (e) {
    console.error("Failed to fetch requests", e)
  } finally {
    loadingRequests.value = false
  }
}

const filteredRequests = computed(() => {
  if (requestFilter.value === 'All') return requests.value
  return requests.value.filter(r => r.status === requestFilter.value)
})

const handleRequest = async (requestId, action) => {
  if (!confirm(`Are you sure you want to ${action} this request?`)) return
  try {
    await api.post(`/api/joinClubRequests/${requestId}/${action.toLowerCase()}`)
    const reqIndex = requests.value.findIndex(r => r.id === requestId)
    if (reqIndex !== -1) {
      requests.value[reqIndex].status = action === 'Approve' ? 'Approved' : 'Rejected'
    }
  } catch (e) {
    alert(`Failed to ${action} request`)
  }
}

// --- Helpers ---
const getStatusClass = (status) => {
  if (status === 'Pending') return 'status-pending'
  if (status === 'Approved') return 'status-approved'
  if (status === 'Rejected') return 'status-rejected'
  return ''
}

const goToProfile = (userName) => {
  if (!userName) return; 
  router.push({ name: 'UserProfile', params: { username: userName } })
}

watch(activeTab, (newTab) => {
  if (newTab === 'requests' && canViewRequests.value) {
    fetchRequests()
  }
})

const clubAvatar = computed(() => {
  if (isEditing.value && editForm.value.avatarURL) return editForm.value.avatarURL
  if (club.value?.avatarURL) return club.value.avatarURL
  return getAvatar(club.value?.name)
})

const coverStyle = computed(() => {
  const url = isEditing.value ? editForm.value.backGroundURL : club.value?.backGroundURL
  if (url) {
    return { backgroundImage: `url(${url})` }
  }
  return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
})

const volleyboxWidgetSrc = computed(() => {
  const id = club.value?.volleyBoxUrl || club.value?.VolleyBoxUrl;
  if (!id) return null;
  return `https://volleybox.net/widget/soonest_match/${id}`;
})

const copyCode = () => {
  if(club.value?.joinCode) {
    navigator.clipboard.writeText(club.value.joinCode)
    alert('Invite code copied to clipboard!')
  }
}

const goBack = () => router.back()

onMounted(() => {
  fetchClub()
})
</script>

<template>
  <div class="page-container">
    
    <div v-if="loading" class="state-box">
      <Spinner></Spinner>
    </div>

    <div v-else-if="error" class="state-box error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="goBack">Return</button>
    </div>

    <div v-else class="content-animate">
      
      <div class="nav-header">
        <button class="btn-back" @click="goBack">
          <span class="icon">←</span> Back to Clubs
        </button>

        <div class="actions-group" v-if="canEdit">
          <template v-if="!isEditing">
            <button class="btn-primary" @click="startEdit">✎ Edit Club</button>
          </template>
          <template v-else>
            <button class="btn-secondary" @click="cancelEdit" :disabled="isSaving">Cancel</button>
            <button class="btn-primary" @click="saveClub" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </template>
        </div>
      </div>

      <div class="card header-card">
        <div class="cover-image" :style="coverStyle"></div>
        <div class="header-content">
          <div class="avatar-container">
            <img :src="clubAvatar" alt="Club Logo" class="avatar-img" />
          </div>
          <div class="title-container">
            <template v-if="isEditing">
               <input v-model="editForm.name" class="edit-input title-input" placeholder="Club Name" />
            </template>
            <template v-else>
               <h1 class="club-title">{{ club.name }}</h1>
               <div class="badges-row">
                 <span class="since-badge" v-if="club.createdAt">Est. {{ new Date(club.createdAt).getFullYear() }}</span>
                 <span v-if="myClubRole" class="role-badge-header">{{ myClubRole }}</span>
               </div>
            </template>
          </div>
        </div>
      </div>

      <div class="tabs-bar" v-if="canViewRequests">
        <button class="tab-btn" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
        <button class="tab-btn" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
          Join Requests
          <span v-if="requests.some(r => r.status === 'Pending')" class="badge-dot"></span>
        </button>
      </div>

      <div v-if="activeTab === 'overview'" class="tab-content">
        <div class="grid-layout">
          
          <div class="left-column">
            
            <div v-if="club.joinCode && !isEditing" class="card invite-card">
              <div class="invite-header">
                <span class="card-label">Internal Access</span>
              </div>
              <div class="code-box" @click="copyCode" title="Click to copy">
                <div class="code-label">INVITE CODE</div>
                <div class="code-value">{{ club.joinCode }}</div>
                <div class="copy-icon">📋</div>
              </div>
            </div>

            <div v-if="isEditing" class="card edit-card">
              <h3 class="section-title">Club Settings</h3>
              <div class="form-group"><label>Avatar URL</label><input v-model="editForm.avatarURL" class="edit-input" /></div>
              <div class="form-group"><label>Background URL</label><input v-model="editForm.backGroundURL" class="edit-input" /></div>
              <div class="form-group"><label>Volleybox Profile URL</label><input v-model="editForm.volleyBoxUrl" class="edit-input" /></div>
            </div>

            <div class="card info-card">
              <h3 class="section-title">About the Club</h3>
              <template v-if="isEditing">
                <textarea v-model="editForm.description" class="edit-textarea" rows="8"></textarea>
              </template>
              <template v-else>
                <div v-if="club.description" class="club-desc">{{ club.description }}</div>
                <p v-else class="club-desc italic">No description provided.</p>
                <div class="meta-row"><span class="meta-item">📅 Joined {{ formatDate(club.createdAt) }}</span></div>
              </template>
            </div>
          </div>

          <div class="right-column" v-if="volleyboxWidgetSrc && !isEditing">
            <div class="card vb-card widget-card">
              <div class="vb-header"><span class="vb-logo">🏐</span><span class="vb-title">Next Match</span></div>
              <div class="widget-wrapper"><iframe :src="volleyboxWidgetSrc" frameborder="0" scrolling="no" class="match-widget-iframe"></iframe></div>
              <div class="vb-footer"><small>Powered by Volleybox</small></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'requests'" class="tab-content">
        <div class="filter-pills">
           <button v-for="filter in ['Pending', 'Approved', 'Rejected', 'All']" :key="filter"
             class="pill" :class="{ active: requestFilter === filter }" @click="requestFilter = filter">
             {{ filter }}
           </button>
        </div>

        <div v-if="loadingRequests" class="state-box">
          <Spinner />
        </div>

        <div v-else-if="filteredRequests.length === 0" class="state-box">
          <div class="empty-icon">📭</div>
          <p>No {{ requestFilter !== 'All' ? requestFilter.toLowerCase() : '' }} requests found.</p>
        </div>

        <div v-else class="requests-grid">
          <div v-for="req in filteredRequests" :key="req.id" class="card request-card clickable-card" @click="goToProfile(req.userName)">
             <div class="req-avatar">
                <img :src="req.userAvatar || getAvatar(req.userName)" alt="User" />
             </div>
             <div class="req-info">
                <h4 class="req-fullname">
                  {{ req.firstName }} {{ req.lastName }}
                  <span v-if="!req.firstName && !req.lastName">{{ req.userName }}</span>
                </h4>
                <div class="req-username">@{{ req.userName }}</div>
                <div v-if="req.email" class="req-email">✉️ {{ req.email }}</div>
                <div class="req-meta">📅 {{ formatDate(req.createdAt) }}</div>
             </div>
             <div class="req-actions">
                <template v-if="req.status === 'Pending'">
                  <button class="btn-action approve" @click.stop="handleRequest(req.id, 'Approve')">Approve</button>
                  <button class="btn-action reject" @click.stop="handleRequest(req.id, 'Reject')">Reject</button>
                </template>
                <template v-else>
                   <span class="status-badge" :class="getStatusClass(req.status)">{{ req.status }}</span>
                </template>
             </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* --- Global Container --- */
.page-container {
  width: 100%;
  max-width: 2200px; /* Ограничиваем ширину на больших экранах */
  margin: 0 auto;    /* Центрируем */
  box-sizing: border-box;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #1f2937;
}

.content-animate { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* --- Navigation --- */
.nav-header { 
  margin-bottom: 20px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  flex-wrap: wrap; 
  gap: 15px; 
}

.btn-back {
  background: white; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 8px;
  color: #4b5563; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn-back:hover { background: #f9fafb; color: #111827; }

.actions-group { display: flex; gap: 10px; }
.btn-primary { background: #0ea5e9; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-secondary { background: white; border: 1px solid #d1d5db; color: #4b5563; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }

/* --- Hero Card --- */
.card {
  background: white; border-radius: 16px; border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; margin-bottom: 24px;
}
.header-card { position: relative; }
.cover-image { 
  height: 250px; width: 100%; 
  background-size: cover; background-position: center; 
}
.header-content {
  padding: 0 30px 20px; position: relative; display: flex; flex-direction: column; align-items: flex-start;
}
.avatar-container {
  margin-top: -60px; padding: 4px; background: white; border-radius: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.avatar-img { 
  width: 120px; height: 120px; border-radius: 20px; object-fit: cover; 
}
.title-container { margin-top: 15px; width: 100%; }
.club-title { margin: 0; font-size: 2.2rem; font-weight: 800; line-height: 1.2; word-break: break-word; }
.badges-row { margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap; }
.since-badge { background: #f3f4f6; color: #6b7280; font-size: 0.85rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
.role-badge-header { background: #e0f2fe; color: #0284c7; font-size: 0.85rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }

/* --- Tabs --- */
.tabs-bar { 
  display: flex; gap: 20px; margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; 
  overflow-x: auto; /* Scroll on small screens */
}
.tab-btn {
  background: none; border: none; padding: 10px 5px; font-size: 1rem; white-space: nowrap;
  color: #6b7280; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; position: relative;
}
.tab-btn.active { color: #0ea5e9; border-bottom-color: #0ea5e9; }
.badge-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; position: absolute; top: 8px; right: -5px; }

/* --- Layout Grid --- */
.grid-layout { 
  display: grid; 
  grid-template-columns: 1fr 350px; 
  gap: 24px; 
}
.left-column, .right-column { display: flex; flex-direction: column; }

/* --- Content Cards --- */
.info-card { flex: 1; padding: 25px; }
.club-desc {
  white-space: pre-line; /* IMPORTANT: Preserves newlines */
  word-break: break-word; /* Prevent overflow */
  font-size: 1rem;
  line-height: 1.6;
  color: #4b5563;
}
.edit-card { padding: 25px; border-left: 4px solid #0ea5e9; }
.section-title { font-size: 1.2rem; margin: 0 0 15px 0; color: #374151; }
.meta-row { margin-top: 20px; padding-top: 15px; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 0.9rem; }

/* --- Invite Code --- */
.invite-card { background: linear-gradient(to right, #eff6ff, #ffffff); border-color: #bfdbfe; padding: 20px; }
.code-box {
  margin-top: 10px; background: white; border: 2px dashed #93c5fd; border-radius: 12px;
  padding: 15px; display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: all 0.2s; flex-wrap: wrap; gap: 10px;
}
.code-value { font-size: 1.5rem; font-weight: 800; color: #1e40af; font-family: monospace; word-break: break-all; }

/* --- Forms --- */
.form-group label { font-size: 0.9rem; font-weight: 600; display: block; margin-bottom: 5px; }
.edit-input, .edit-textarea { 
  width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; 
  font-family: inherit; font-size: 1rem;
}
.title-input { font-size: 1.8rem; font-weight: 700; margin-bottom: 10px; }

/* --- Requests --- */
.filter-pills { 
  display: flex; gap: 10px; margin-bottom: 20px; 
  overflow-x: auto; padding-bottom: 5px; /* Horizontal scroll for mobile */
}
.pill { 
  padding: 6px 16px; border-radius: 20px; border: 1px solid #e5e7eb; 
  background: white; color: #6b7280; cursor: pointer; font-size: 0.9rem; white-space: nowrap; 
}
.pill.active { background: #0ea5e9; color: white; border-color: #0ea5e9; }

.requests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px; }
.request-card { display: flex; align-items: center; padding: 15px; gap: 15px; }
.req-avatar img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
.req-info { flex: 1; min-width: 0; }
.req-fullname { margin: 0; font-size: 1.05rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.req-username { font-size: 0.9rem; color: #6b7280; }
.req-email { font-size: 0.85rem; color: #4b5563; word-break: break-all; }
.req-actions { display: flex; gap: 8px; flex-direction: column; justify-content: center; }

/* --- Widget --- */
.vb-card { height: 100%; padding: 0; display: flex; flex-direction: column; border-top: 4px solid #ef4444; }
.vb-header, .vb-footer { padding: 10px 20px; }
.widget-wrapper { background: white; flex: 1; position: relative; min-height: 250px; }
.match-widget-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

/* --- States --- */
.state-box { padding: 60px; text-align: center; color: #9ca3af; background: white; border-radius: 16px; border: 1px dashed #e5e7eb; margin: 40px; }
.clickable-card { cursor: pointer; transition: transform 0.2s; }
.clickable-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); border-color: #93c5fd; }
.btn-action { z-index: 2; position: relative; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; font-size: 0.85rem; }
.approve { background: #dcfce7; color: #166534; }
.approve:hover { background-color: #b0dfc0;}
.reject { background: #fee2e2; color: #991b1b; }
.reject:hover { background-color: #ddafaf;}
.status-badge { font-size: 0.8rem; padding: 4px 10px; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
.status-pending { background: #fff7ed; color: #c2410c; }
.status-approved { background: #f0fdf4; color: #15803d; }
.status-rejected { background: #fef2f2; color: #b91c1c; }

/* --- MOBILE RESPONSIVENESS --- */
@media (max-width: 900px) {
  .grid-layout { grid-template-columns: 1fr; } /* Stack columns */
  .requests-grid { grid-template-columns: 1fr; } /* Stack requests */
}

@media (max-width: 600px) {
  .page-container { padding: 15px; }
  
  .nav-header { flex-direction: column; align-items: stretch; gap: 10px; }
  .actions-group { width: 100%; justify-content: space-between; }
  .btn-primary, .btn-secondary, .btn-back { width: 100%; justify-content: center; }

  .cover-image { height: 180px; }
  .avatar-img { width: 100px; height: 100px; }
  .club-title { font-size: 1.8rem; }
  
  .header-content { padding: 0 20px 20px; align-items: center; text-align: center; }
  .title-container { text-align: center; }
  .badges-row { justify-content: center; }

  .req-actions { flex-direction: row; margin-top: 10px; width: 100%; }
  .btn-action { flex: 1; }
  .request-card { flex-direction: column; align-items: flex-start; }
  .req-avatar { margin-bottom: 10px; }
  .req-info { width: 100%; }
}
</style>
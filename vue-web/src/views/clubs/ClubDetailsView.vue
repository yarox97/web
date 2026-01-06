<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import  api  from '@/services/api' 
import { formatDate } from '@/utils/dateFormater'
import { getAvatar } from '@/utils/getAvatar'
import Spinner from '@/components/shared/Spinner.vue'

const route = useRoute()
const router = useRouter()

const club = ref(null)
const loading = ref(true)
const error = ref(null)
const clubId = route.params.id

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

const clubAvatar = computed(() => {
  if (club.value?.avatarURL) return club.value.avatarURL
  return getAvatar(club.value?.name)
})

const coverStyle = computed(() => {
  if (club.value?.backGroundURL) {
    return { backgroundImage: `url(${club.value.backGroundURL})` }
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
      </div>

      <div class="card header-card">
        <div class="cover-image" :style="coverStyle"></div>
        <div class="header-content">
          <div class="avatar-container">
            <img :src="clubAvatar" alt="Club Logo" class="avatar-img" />
          </div>
          <div class="title-container">
            <h1 class="club-title">{{ club.name }}</h1>
            <span class="since-badge" v-if="club.createdAt">Est. {{ new Date(club.createdAt).getFullYear() }}</span>
          </div>
        </div>
      </div>

      <div class="grid-layout">
        
        <div class="left-column">
          
          <div v-if="club.joinCode" class="card invite-card">
            <div class="invite-header">
              <span class="card-label">Internal Access</span>
            </div>
            <div class="code-box" @click="copyCode" title="Click to copy">
              <div class="code-label">INVITE CODE</div>
              <div class="code-value">{{ club.joinCode }}</div>
              <div class="copy-icon">📋</div>
            </div>
          </div>

          <div class="card info-card">
            <h3 class="section-title">About the Club</h3>
            <p v-if="club.description" class="club-desc">
              {{ club.description }}
            </p>
            <p v-else class="club-desc italic">No description provided for this club.</p>
            
            <div class="meta-row">
              <span class="meta-item">📅 Joined {{ formatDate(club.createdAt) }}</span>
            </div>
          </div>

        </div>

        <div class="right-column" v-if="volleyboxWidgetSrc">
          
          <div class="card vb-card widget-card">
            <div class="vb-header">
              <span class="vb-logo">🏐</span>
              <span class="vb-title">Next Match</span>
            </div>
            
            <div class="widget-wrapper">
              <iframe 
                :src="volleyboxWidgetSrc" 
                frameborder="0" 
                scrolling="no"
                class="match-widget-iframe"
              ></iframe>
            </div>
            
            <div class="vb-footer">
              <small>Powered by Volleybox</small>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  width: 100%;
  box-sizing: border-box;
  padding: 20px 40px; 
  font-family: 'Segoe UI', sans-serif;
  color: #1f2937;
}

.content-animate {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Navigation --- */
.nav-header { margin-bottom: 20px; }
.btn-back {
  background: white; border: 1px solid #e5e7eb; padding: 8px 16px; border-radius: 8px;
  color: #4b5563; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn-back:hover { background: #f9fafb; color: #111827; border-color: #d1d5db; }

/* --- Header Hero --- */
.card {
  background: white; border-radius: 16px; border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden; margin-bottom: 24px;
}

.header-card { position: relative; }
.cover-image {
  height: 250px; width: 100%;
  background-size: cover; background-position: center;
}
.header-content {
  padding: 0 30px 20px; position: relative;
  display: flex; flex-direction: column; align-items: flex-start;
}
.avatar-container {
  margin-top: -60px; padding: 4px; background: white; border-radius: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.avatar-img {
  width: 120px; height: 120px; border-radius: 20px; object-fit: cover; display: block;
}
.title-container { margin-top: 15px; }
.club-title { margin: 0; font-size: 2.2rem; font-weight: 800; color: #111827; letter-spacing: -0.02em; }
.since-badge {
  display: inline-block; background: #f3f4f6; color: #6b7280; font-size: 0.85rem;
  padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-top: 5px;
}

/* --- GRID SYSTEM & STRETCHING LOGIC --- */
.grid-layout {
  display: grid;
  /* Левая колонка - резина (1fr), Правая - фиксирована (350px) */
  grid-template-columns: 1fr 350px; 
  gap: 24px;
  /* Убрали align-items: start, теперь по умолчанию stretch (растягивание) */
}

/* --- LEFT COLUMN --- */
.left-column {
    display: flex;
    flex-direction: column;
}
/* Карточка с информацией растягивается на всю оставшуюся высоту левой колонки */
.info-card {
    flex: 1; 
}

.invite-card {
  background: linear-gradient(to right, #eff6ff, #ffffff);
  border-color: #bfdbfe;
  padding: 20px;
}
.card-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #3b82f6; font-weight: 700; }
.code-box {
  margin-top: 10px; background: white; border: 2px dashed #93c5fd; border-radius: 12px;
  padding: 15px; display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: all 0.2s;
}
.code-box:hover { border-color: #3b82f6; background: #f0f9ff; transform: scale(1.01); }
.code-label { font-size: 0.7rem; color: #9ca3af; font-weight: 600; }
.code-value { font-size: 1.5rem; font-weight: 800; color: #1e40af; font-family: 'Courier New', monospace; letter-spacing: 1px; }
.copy-icon { font-size: 1.2rem; }

.info-card { padding: 25px; }
.section-title { font-size: 1.2rem; margin: 0 0 15px 0; color: #374151; }
.club-desc { font-size: 1rem; line-height: 1.6; color: #4b5563; }
.italic { font-style: italic; color: #9ca3af; }
.meta-row { margin-top: 20px; padding-top: 15px; border-top: 1px solid #f3f4f6; color: #6b7280; font-size: 0.9rem; }

/* --- RIGHT COLUMN (Volleybox) --- */
.right-column {
    display: flex;
    flex-direction: column;
}

/* Карточка виджета должна растягиваться на всю высоту колонки */
.vb-card { 
    padding: 0; 
    border-top: 4px solid #ef4444;
    display: flex;
    flex-direction: column;
    height: 100%; /* Занимает всю высоту родителя */
    margin-bottom: 0; /* Убираем нижний отступ, чтобы было ровно */
}

.vb-header {
  padding: 15px 20px; border-bottom: 1px solid #f3f4f6;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; /* Не сжимать заголовок */
}

.vb-footer {
  padding: 10px 20px; background: #f9fafb; border-top: 1px solid #f3f4f6; color: #9ca3af; text-align: right;
  flex-shrink: 0; /* Не сжимать футер */
}
.vb-logo { font-size: 1.2rem; margin-right: 8px; }
.vb-title { font-weight: 700; color: #111827; font-size: 1rem; }

.widget-wrapper {
  background: white;
  flex: 1; 
  position: relative;
  min-height: 200px; 
}

.match-widget-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%; 
  border: none;
  display: block;
  pointer-events: none; 
}

.state-box { padding: 60px; text-align: center; color: #9ca3af; background: white; border-radius: 16px; border: 1px dashed #e5e7eb; margin: 40px; }

@media (max-width: 1000px) {
  .grid-layout { 
      grid-template-columns: 1fr; 
      gap: 24px;
  }

  .match-widget-iframe {
      position: relative;
      height: 300px; 
  }
  .vb-card {
      height: auto;
  }
  
  .page-container { padding: 15px; }
  .header-content { align-items: center; text-align: center; }
  .cover-image { height: 180px; }
}
</style>
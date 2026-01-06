<script setup>
import { formatDate } from '@/utils/dateFormater'
import { useRouter } from 'vue-router'

const props = defineProps({
  club: { type: Object, required: true }
})

const router = useRouter()

const getAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`
}

const getRoleClass = (role) => {
  if (role === 'President') return 'role-president'
  if (role === 'Admin') return 'role-admin'
  return 'role-member'
}

const openDetails = () => {
  router.push({ name: 'ClubDetails', params: { id: props.club.clubId } })
}
</script>

<template>
  <div class="club-card">
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
      <button class="view-btn" @click="openDetails">
        Go to club →
      </button>
    </div>
  </div>
</template>

<style scoped>
.club-card {
  background: white;
  padding: 15px 20px;
  border-radius: 16px;
  border: 1px solid #eee;
  display: flex; flex-direction: row; align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.club-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.club-avatar-wrapper { flex-shrink: 0; margin-right: 20px; }

.club-avatar {
  width: 60px; height: 60px;
  border-radius: 12px; object-fit: cover;
}

.card-content-wrapper {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
}

.card-header { margin-bottom: 5px; }
.title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.card-header h3 { margin: 0; font-size: 18px; color: #333; }

.role-badge {
  font-size: 11px; padding: 4px 8px;
  border-radius: 6px; text-transform: uppercase;
  font-weight: 700; letter-spacing: 0.5px; white-space: nowrap;
}
.role-president { background-color: #ffebee; color: #d32f2f; border: 1px solid #ffcdd2; }
.role-admin { background-color: #e3f2fd; color: #1976d2; }
.role-member { background-color: #f5f5f5; color: #616161; }

.join-date { font-size: 13px; color: #888; margin: 0; }

.card-footer { margin-left: 20px; text-align: right; }

.view-btn {
  padding: 10px 20px; background-color: #f8f9fa;
  border: 1px solid #eee; border-radius: 8px;
  color: #333; font-weight: 500;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.view-btn:hover { background-color: #007bff; color: white; border-color: #007bff; }

@media (max-width: 768px) {
  .club-card { flex-direction: column; align-items: flex-start; }
  .club-avatar-wrapper { margin-bottom: 15px; margin-right: 0; width: 100%; display: flex; justify-content: center; }
  .card-content-wrapper { width: 100%; margin-bottom: 15px; text-align: center; }
  .title-row { justify-content: center; }
  .card-footer { width: 100%; margin-left: 0; text-align: center; }
  .view-btn { width: 100%; }
}
</style>
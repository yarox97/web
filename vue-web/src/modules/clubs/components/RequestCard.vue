<script setup>
import { formatDate } from '@/utils/dateFormater'

const props = defineProps({
  request: { type: Object, required: true }
})

defineEmits(['cancel'])

const getAvatarUrl = (name) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`

const getStatusClass = (status) => {
  if (status === 'Pending') return 'status-pending'
  if (status === 'Approved') return 'status-approved'
  if (status === 'Rejected') return 'status-rejected'
  return ''
}
</script>

<template>
  <div class="club-card request-card">
    <div class="club-avatar-wrapper">
      <img :src="getAvatarUrl(request.clubName)" alt="Club Avatar" class="club-avatar grayscale"/>
    </div>
    
    <div class="card-content-wrapper">
      <div class="card-header">
        <div class="title-row">
          <h3>{{ request.clubName }}</h3> 
          <span class="status-badge" :class="getStatusClass(request.status)">
            {{ request.status }}
          </span>
        </div>
      </div>
      <div class="card-body">
        <p class="join-date">Sent: {{ formatDate(request.createdAt) }}</p>
      </div>
    </div>

    <div class="card-footer">
       <button v-if="request.status === 'Pending'" class="view-btn btn-cancel" @click="$emit('cancel', request.id)">
         Cancel
       </button>
       <span v-else class="status-text">
         {{ request.status === 'Approved' ? 'You can now enter the club' : 'Request closed' }}
       </span>
    </div>
  </div>
</template>

<style scoped>
.club-card {
  background: white; padding: 15px 20px;
  border-radius: 16px; border: 1px solid #eee;
  display: flex; flex-direction: row; align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.club-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.08); }

.club-avatar-wrapper { flex-shrink: 0; margin-right: 20px; }
.club-avatar { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; }
.card-content-wrapper { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.card-header { margin-bottom: 5px; }
.title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.card-header h3 { margin: 0; font-size: 18px; color: #333; }
.join-date { font-size: 13px; color: #888; margin: 0; }
.card-footer { margin-left: 20px; text-align: right; }
.view-btn { padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; white-space: nowrap; border: 1px solid #eee; }

.grayscale { filter: grayscale(100%); opacity: 0.7; }

.status-badge {
  font-size: 11px; padding: 4px 8px;
  border-radius: 6px; font-weight: 600; white-space: nowrap;
}
.status-pending { background-color: #fff8e1; color: #f57c00; border: 1px solid #ffe0b2; }
.status-approved { background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
.status-rejected { background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }

.status-text { font-size: 13px; color: #666; font-style: italic; }

.btn-cancel { color: #d32f2f; background: white; border-color: #ffcdd2; }
.btn-cancel:hover { background: #ffebee; color: #b71c1c; border-color: #ef9a9a; }

@media (max-width: 768px) {
  .club-card { flex-direction: column; align-items: flex-start; }
  .club-avatar-wrapper { margin-bottom: 15px; margin-right: 0; width: 100%; display: flex; justify-content: center; }
  .card-content-wrapper { width: 100%; margin-bottom: 15px; text-align: center; }
  .title-row { justify-content: center; }
  .card-footer { width: 100%; margin-left: 0; text-align: center; }
  .view-btn { width: 100%; }
}
</style>
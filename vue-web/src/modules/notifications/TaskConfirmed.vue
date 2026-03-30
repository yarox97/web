<template>
  <div class="notification-body contract-theme">
    
    <div class="icon-area text-purple-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
      </svg>
    </div>

    <div class="content-area">
      <h4 class="title">Task Confirmed</h4>
      
      <p class="description">
        Your completion of the task in <strong>{{ payload.ClubName }}</strong> has been verified.
        <br>
        <span class="meta-info">Confirmed by: {{ confirmerName }}</span>
      </p>

      <div class="task-details-box">
        <h5 class="task-title">{{ payload.TaskTitle }}</h5>
        <p class="task-desc">{{ payload.Description }}</p>

        <div class="task-badges">
          
          <div v-if="payload.ConfirmedAt" class="badge confirmed-badge" title="Confirmed At">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span>Confirmed: {{ formatDate(payload.ConfirmedAt) }}</span>
          </div>

          <div class="badge date-badge" title="Original Due Date">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Due: {{ formatDate(payload.EndDateTime) }}</span>
          </div>

          <div class="badge" :class="priorityClass">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span>{{ payload.TaskPriority }} Priority</span>
          </div>

        </div>
      </div>

      <div class="actions">
        <button class="btn btn-purple" @click="viewTask">
          View Task Details
        </button>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate } from '@/utils/dateFormater' 

const props = defineProps({
  payload: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const confirmerName = computed(() => {
  return props.payload.ConfirmerFullName || 'Management';
});

const hasPenalty = computed(() => {
  const type = props.payload.TaskPenaltyType;
  const val = Number(props.payload.TaskPenaltyValue);
  return type && type !== 'None' && val > 0;
});

const formatPenaltyType = (type) => {
  if (type === 'Financial' || type === 'ValueFine') return 'USD'; 
  if (type === 'Points') return 'pts';
  return type;
};

const priorityClass = computed(() => {
  const p = String(props.payload.TaskPriority).toLowerCase();
  if (p === 'high' || p === 'highest' || p === 'urgent') return 'priority-high';
  if (p === 'medium' || p === 'middle' || p === 'normal') return 'priority-medium';
  return 'priority-low';
});

const viewTask = () => {
  router.push({ name: 'TaskDetails', params: { id: props.payload.TaskId } }) 
}
</script>

<style scoped>
.task-details-box {
  background-color: #ffffff;
  border: 1px solid #e9d5ff; 
  border-radius: 10px;
  padding: 16px;
  margin: 12px 0 16px 0;
  box-shadow: 0 1px 2px rgba(147, 51, 234, 0.05);
}

.task-title {
  margin: 0 0 6px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.task-desc {
  margin: 0 0 14px 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word; 
}

.task-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.confirmed-badge {
  background-color: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.date-badge {
  background-color: #f1f5f9;
  color: #64748b;
}

.priority-high {
  background-color: #ffedd5;
  color: #ea580c;
}

.priority-medium {
  background-color: #fef9c3;
  color: #ca8a04;
}

.priority-low {
  background-color: #dcfce7;
  color: #16a34a;
}
</style>
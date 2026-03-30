<template>
  <div class="notification-body error-theme">
    
    <div class="icon-area text-red-500">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    </div>

    <div class="content-area">
      <h4 class="title">Task Overdue</h4>
      
      <p class="description">
        The deadline for a task in <strong>{{ payload.ClubName }}</strong> has passed!
        <br>
        <span class="meta-info">Assigned by: {{ assignerName }}</span>
      </p>

      <div class="task-details-box error-box">
        <h5 class="task-title">{{ payload.TaskTitle }}</h5>
        <p class="task-desc">{{ payload.Description }}</p>

        <div class="task-badges">
          
          <div class="badge overdue-date-badge" title="Missed Deadline">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Was due: {{ formatDate(payload.EndDateTime) }}</span>
          </div>

          <div class="badge" :class="priorityClass">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span>{{ payload.TaskPriority }} Priority</span>
          </div>

          <div v-if="hasPenalty" class="badge active-penalty-badge" title="Applied Penalty">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Penalty risk: {{ payload.TaskPenaltyValue }} {{ formatPenaltyType(payload.TaskPenaltyType) }}</span>
          </div>

        </div>
      </div>

      <div class="actions">
        <button class="btn btn-red" @click="viewTask">
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

// Читаем имя создателя
const assignerName = computed(() => {
  return props.payload.AssignerFullName || 'Management';
});

// Проверка на наличие штрафа (на случай если в других просроченных задачах он будет)
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

// Приоритеты ('Highest' тоже учтен)
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
  border-radius: 10px;
  padding: 16px;
  margin: 12px 0 16px 0;
}

/* Красная тема для внутренней карточки */
.error-box {
  background-color: #fff;
  border: 1px solid #fecaca;
  box-shadow: 0 1px 2px rgba(220, 38, 38, 0.05);
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

/* Красный бейдж для сорванной даты */
.overdue-date-badge {
  background-color: #fee2e2;
  color: #b91c1c;
}

/* Яркий красный бейдж для штрафа */
.active-penalty-badge {
  background-color: #ef4444;
  color: white;
}

/* Приоритеты */
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
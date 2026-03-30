<template>
  <div class="notification-body task-theme">
    
    <div class="icon-area">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
      </svg>
    </div>

    <div class="content-area">
      <h4 class="title">New Task Assigned</h4>
      
      <p class="description">
        You have been assigned a new task in club <strong>{{ payload.ClubName }}</strong>.
        <br>
        <span class="meta-info">Assigned by: {{ assignerName }}</span>
      </p>

      <div class="task-details-box">
        <h5 class="task-title">{{ payload.TaskTitle }}</h5>
        <p class="task-desc">{{ payload.Description }}</p>

        <div class="task-badges">
          
          <div class="badge date-badge" title="Due Date">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>{{ formatDate(payload.EndDateTime) }}</span>
          </div>

          <div class="badge" :class="priorityClass">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span>{{ payload.TaskPriority }} Priority</span>
          </div>

          <div v-if="hasPenalty" class="badge penalty-badge" title="Penalty for failure">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Penalty: {{ payload.TaskPenaltyValue }} {{ formatPenaltyType(payload.TaskPenaltyType) }}</span>
          </div>

        </div>
      </div>

      <div class="actions">
        <button class="btn btn-blue" @click="viewTask">
          Open Task Details
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

// Изменено на AssignerFullName, как приходит в JSON
const assignerName = computed(() => {
  return props.payload.AssignerFullName || 'Management';
});

// Добавлено преобразование Number(), так как с бэка приходит строка "0"
const hasPenalty = computed(() => {
  const type = props.payload.TaskPenaltyType;
  const val = Number(props.payload.TaskPenaltyValue);
  return type && type !== 'None' && val > 0;
});

const formatPenaltyType = (type) => {
  if (type === 'Financial') return 'USD'; // Можно заменить на вашу валюту
  if (type === 'Points') return 'pts';
  return type;
};

// Добавлено распознавание слова 'middle', которое приходит с бэка
const priorityClass = computed(() => {
  const p = String(props.payload.TaskPriority).toLowerCase();
  if (p === 'high' || p === 'urgent') return 'priority-high';
  if (p === 'medium' || p === 'middle' || p === 'normal') return 'priority-medium';
  return 'priority-low';
});

const viewTask = () => {
  router.push({ name: 'TaskDetails', params: { id: props.payload.TaskId } }) 
}
</script>

<style scoped>
.task-details-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  margin: 12px 0 16px 0;
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
  word-break: break-word; /* Помогает, если в тексте нет пробелов (как в "вапвапвапва") */
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

.date-badge {
  background-color: #e0f2fe;
  color: #0284c7;
}

.penalty-badge {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.priority-high {
  background-color: #ffedd5;
  color: #ea580c;
}

/* Middle / Medium приоритет */
.priority-medium {
  background-color: #fef9c3;
  color: #ca8a04;
}

.priority-low {
  background-color: #dcfce7;
  color: #16a34a;
}
</style>
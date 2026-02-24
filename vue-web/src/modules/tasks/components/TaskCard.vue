<template>
  <div class="task-card" :class="statusClass">
    <div class="task-header">
      <div class="title-and-priority">
        <h3 class="task-title">{{ task.title }}</h3>
        <span 
          v-if="task.taskPriority && task.taskPriority !== 'None'" 
          class="task-priority" 
          :class="priorityClass"
        >
          Priority: {{ task.taskPriority }}
        </span>
      </div>
      <span v-if="!hideStatus" class="task-status">{{ formattedStatus }}</span>
    </div>
    
    <p class="task-desc">{{ task.description }}</p>
    
    <div class="task-footer">
      <div class="task-info">
        <span class="info-label">Club:</span>
        <span class="info-value">{{ task.clubName || 'Unknown' }}</span>
      </div>
      <div class="task-info">
        <span class="info-label">Deadline:</span>
        <span class="info-value" :class="{'overdue': isOverdue}">
          {{ formattedDeadline }}
        </span>
      </div>
    </div>

    <div class="task-financials" v-if="task.penaltyType && task.penaltyType !== 'None' && task.penaltyAmount">
      <span v-if="isPenalty" class="penalty">
        Penalty: -{{ task.penaltyAmount }}{{ financialSymbol }}
      </span>
      <span v-else-if="isBonus" class="reward">
        Bonus: +{{ task.penaltyAmount }}{{ financialSymbol }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from '@/utils/dateFormater' 

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  hideStatus: {
    type: Boolean,
    default: false
  }
})

const isBonus = computed(() => ['ValuePremia', 'PercentPremia'].includes(props.task.penaltyType))
const isPenalty = computed(() => ['ValueFine', 'PercentFine'].includes(props.task.penaltyType))
const financialSymbol = computed(() => ['PercentFine', 'PercentPremia'].includes(props.task.penaltyType) ? '%' : '$')

const priorityClass = computed(() => {
  if (!props.task.taskPriority) return ''
  const p = props.task.taskPriority.toLowerCase()
  if (p === 'highest' || p === 'high') return 'priority-high'
  if (p === 'medium' || p === 'middle') return 'priority-medium'
  if (p === 'low' || p === 'lowest') return 'priority-low'
  return ''
})

// 1. Получаем текущий статус задачи
const currentStatus = computed(() => props.task.myStatus || props.task.taskStatus || 'Uncompleted')

// 2. Безопасно проверяем флаг hasResponses из вашего JSON
const hasResponses = computed(() => {
  if (props.task.hasResponses === true || props.task.HasResponses === true) return true;
  if (props.task.responses && props.task.responses.length > 0) return true;
  if (props.task.Responses && props.task.Responses.length > 0) return true;
  return false;
})

// 3. Вычисляем цвет CSS-класса
const statusClass = computed(() => {
  if (props.hideStatus) return 'status-neutral'
  
  const s = currentStatus.value;
  if (s === 'Completed' || s === 'Confirmed') return 'status-completed';
  if (s === 'Overdued' || s === 'Failed') return 'status-failed'; 
  if (s === 'Returned') return 'status-returned'; 
  if (s === 'Unconfirmed') return 'status-unconfirmed'; 
  
  // Если статус Uncompleted, и ЕСТЬ ответы -> Синий In Progress
  if (s === 'Uncompleted' && hasResponses.value) return 'status-inprogress';
  
  // Во всех остальных случаях Uncompleted (без ответов) -> Оранжевый Pending
  return 'status-pending'; 
})

// 4. Вычисляем текст бейджика
const formattedStatus = computed(() => {
  const s = currentStatus.value;
  
  if (s === 'Completed') return 'Completed';
  if (s === 'Confirmed') return 'Confirmed';
  if (s === 'Overdued') return 'Overdue';
  if (s === 'Failed') return 'Failed';
  if (s === 'Returned') return 'Returned';
  if (s === 'Unconfirmed') return 'Awaiting Confirm';
  
  // Если статус Uncompleted, и ЕСТЬ ответы -> Пишем "In Progress"
  if (s === 'Uncompleted' && hasResponses.value) return 'In Progress';
  
  // Иначе пишем "Pending"
  return 'Pending';
})

const isOverdue = computed(() => {
  if (!props.task.schedule?.endDate) return false;
  return new Date(props.task.schedule.endDate) < new Date() && currentStatus.value !== 'Completed' && currentStatus.value !== 'Confirmed';
})

const formattedDeadline = computed(() => {
  if (!props.task.schedule?.endDate) return 'No Deadline'
  return formatDate(props.task.schedule.endDate) 
})
</script>

<style scoped>
/* Базовые стили карточки оставляем как были... */
.task-card {
  background: var(--color-background-soft, #ffffff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #ccc;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* ЦВЕТА БОКОВОЙ ПОЛОСКИ ДЛЯ ВАШИХ ENUMS */
.status-completed { border-left-color: var(--color-success, #28a745); }
.status-failed { border-left-color: var(--color-danger, #dc3545); }
.status-inprogress { border-left-color: #3b82f6; } 
.status-pending { border-left-color: var(--color-warning, #f59e0b); } 
.status-returned { border-left-color: #f97316; } /* Оранжевый для возвращенных */
.status-unconfirmed { border-left-color: #8b5cf6; } /* Фиолетовый для ожидающих подтверждения админа */
.status-neutral { border-left-color: #cbd5e1; } 

.task-header { display: flex; justify-content: space-between; align-items: flex-start; }
.task-title { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary, #333); }

/* ЦВЕТА БЕЙДЖЕЙ ДЛЯ ВАШИХ ENUMS */
.task-status {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 20px;
  background: #f0f0f0;
  color: #666;
  font-weight: 600;
  white-space: nowrap;
}

.status-completed .task-status { background: #e6f4ea; color: #1e8e3e; }
.status-failed .task-status { background: #fce8e6; color: #d93025; }
.status-inprogress .task-status { background: #e0f2fe; color: #2563eb; } 
.status-pending .task-status { background: #fef3c7; color: #b45309; } 
.status-returned .task-status { background: #ffedd5; color: #c2410c; }
.status-unconfirmed .task-status { background: #ede9fe; color: #6d28d9; }

.task-desc {
  color: var(--color-text-secondary, #666);
  font-size: 0.95rem; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.task-footer {
  display: flex; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid #eee; font-size: 0.85rem;
}

.info-label { color: #999; margin-right: 4px; }
.info-value { font-weight: 500; color: #444; }
.overdue { color: var(--color-danger, #dc3545); font-weight: bold; }

.task-financials { display: flex; gap: 10px; font-size: 0.85rem; font-weight: bold; }
.penalty { color: #ef4444; background: #fef2f2; padding: 2px 8px; border-radius: 6px;}
.reward { color: #16a34a; background: #f0fdf4; padding: 2px 8px; border-radius: 6px;}

.title-and-priority { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }

.task-priority { font-size: 0.7rem; padding: 3px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.priority-high { background: #fee2e2; color: #b91c1c; } 
.priority-medium { background: #fef9c3; color: #a16207; } 
.priority-low { background: #dcfce7; color: #15803d; } 
</style>
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
      <span class="task-status">{{ formattedStatus }}</span>
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

    <div class="task-financials" v-if="task.penaltyAmount || task.rewardAmount">
      <span v-if="task.penaltyAmount" class="penalty">
        Penalty: -{{ task.penaltyAmount }} {{ task.penaltyType === 'Percent' ? '%' : '$' }}
      </span>
      <span v-if="task.rewardAmount" class="reward">
        Reward: +{{ task.rewardAmount }} {{ task.rewardType === 'Percent' ? '%' : '$' }}
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
  }
})

// ДОБАВЛЕНО: Вычисляем класс для цвета приоритета
const priorityClass = computed(() => {
  if (!props.task.taskPriority) return ''
  const p = props.task.taskPriority.toLowerCase()
  if (p === 'highest' || p === 'high') return 'priority-high'
  if (p === 'medium') return 'priority-medium'
  if (p === 'low' || p === 'lowest') return 'priority-low'
  return ''
})

const statusClass = computed(() => {
  return `status-${props.task.myStatus?.toLowerCase() || 'pending'}`
})

const formattedStatus = computed(() => {
  const statuses = {
    'Completed': 'Completed',
    'Pending': 'Pending',
    'Failed': 'Failed',
    'Uncompleted': 'In Progress'
  }
  return statuses[props.task.myStatus] || props.task.myStatus
})

const isOverdue = computed(() => {
  if (!props.task.schedule?.endDate) return false;
  return new Date(props.task.schedule.endDate) < new Date() && props.task.myStatus !== 'Completed';
})

const formattedDeadline = computed(() => {
  if (!props.task.schedule?.endDate) return 'No Deadline' // Заменил "Без срока" на англ.
  return formatDate(props.task.schedule.endDate) 
})
</script>

<style scoped>
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

.status-completed { border-left-color: var(--color-success, #28a745); }
.status-pending, .status-uncompleted { border-left-color: var(--color-warning, #ffc107); }
.status-failed { border-left-color: var(--color-danger, #dc3545); }

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.task-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary, #333);
}

.task-status {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 20px;
  background: #f0f0f0;
  color: #666;
  font-weight: 500;
}

.status-completed .task-status { background: #e6f4ea; color: #1e8e3e; }
.status-failed .task-status { background: #fce8e6; color: #d93025; }

.task-desc {
  color: var(--color-text-secondary, #666);
  font-size: 0.95rem;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 0.85rem;
}

.info-label { color: #999; margin-right: 4px; }
.info-value { font-weight: 500; color: #444; }
.overdue { color: var(--color-danger, #dc3545); font-weight: bold; }

.task-financials {
  display: flex;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: bold;
}
.penalty { color: #dc3545; }
.reward { color: #28a745; }

/* ДОБАВЛЕННЫЕ СТИЛИ ДЛЯ ПРИОРИТЕТА */
.title-and-priority {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.task-priority {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high { background: #fee2e2; color: #b91c1c; } /* Красный */
.priority-medium { background: #fef9c3; color: #a16207; } /* Желтый/Оранжевый */
.priority-low { background: #dcfce7; color: #15803d; } /* Зеленый */
</style>
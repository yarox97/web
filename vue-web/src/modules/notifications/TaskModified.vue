<template>
  <div class="notification-body warning-theme">
    
    <div class="icon-area">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
      </svg>
    </div>

    <div class="content-area">
      <h4 class="title">Task Updated</h4>
      
      <p class="description">
        The task in club <strong>{{ payload.ClubName }}</strong> has been modified.
        <br>
        <span class="meta-info">Updated by: {{ assignerName }}</span>
      </p>

      <div v-if="changes.length > 0" class="changelog-box">
        <div class="changelog-title">Detected Changes:</div>
        <div v-for="(change, index) in changes" :key="index" class="changelog-item">
          <span class="change-label">{{ change.label }}:</span>
          
          <template v-if="change.oldVal">
            <span class="change-old">{{ change.oldVal }}</span>
            <svg class="change-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
            <span class="change-new">{{ change.newVal }}</span>
          </template>

          <template v-else>
            <span class="change-new">Updated</span>
          </template>
        </div>
      </div>

      <div class="task-details-box">
        <h5 class="task-title">{{ payload.NewTaskTitle }}</h5>
        <p class="task-desc">{{ payload.NewDescription }}</p>

        <div class="task-badges">
          <div class="badge date-badge" title="New Due Date">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>{{ formatDate(payload.NewEndDateTime) }}</span>
          </div>

          <div class="badge" :class="priorityClass">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            <span>{{ payload.NewTaskPriority }} Priority</span>
          </div>

          <div v-if="hasPenalty" class="badge penalty-badge" title="Penalty for failure">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Penalty: {{ payload.NewTaskPenaltyValue }} {{ formatPenaltyType(payload.NewTaskPenaltyType) }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-orange" @click="viewTask">
          Review Task
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

const assignerName = computed(() => {
  return props.payload.AssignerFullName || 'Management';
});

const formatPenaltyString = (val, type) => {
  const v = Number(val);
  if (!type || type === 'None' || isNaN(v) || v === 0) return 'None';
  if (type === 'Financial') return `${v} USD`;
  if (type === 'Points') return `${v} pts`;
  return `${v} ${type}`;
};

const formatPenaltyType = (type) => {
  if (type === 'Financial') return 'USD'; 
  if (type === 'Points') return 'pts';
  return type;
};

const changes = computed(() => {
  const p = props.payload;
  const diffs = [];

  if (p.OldTaskTitle !== p.NewTaskTitle) {
    diffs.push({ label: 'Title', oldVal: p.OldTaskTitle, newVal: p.NewTaskTitle });
  }

  if (p.OldDescription !== p.NewDescription) {
    diffs.push({ label: 'Description', oldVal: null, newVal: 'Updated' });
  }

  if (p.OldEndDateTime !== p.NewEndDateTime) {
    diffs.push({ 
      label: 'Deadline', 
      oldVal: formatDate(p.OldEndDateTime), 
      newVal: formatDate(p.NewEndDateTime) 
    });
  }

  if (p.OldTaskPriority !== p.NewTaskPriority) {
    diffs.push({ label: 'Priority', oldVal: p.OldTaskPriority, newVal: p.NewTaskPriority });
  }

  const oldPenalty = formatPenaltyString(p.OldTaskPenaltyValue, p.OldTaskPenaltyType);
  const newPenalty = formatPenaltyString(p.NewTaskPenaltyValue, p.NewTaskPenaltyType);
  if (oldPenalty !== newPenalty) {
    diffs.push({ label: 'Penalty', oldVal: oldPenalty, newVal: newPenalty });
  }

  return diffs;
});

const hasPenalty = computed(() => {
  const type = props.payload.NewTaskPenaltyType;
  const val = Number(props.payload.NewTaskPenaltyValue);
  return type && type !== 'None' && val > 0;
});

const priorityClass = computed(() => {
  const p = String(props.payload.NewTaskPriority).toLowerCase();
  if (p === 'high' || p === 'urgent') return 'priority-high';
  if (p === 'medium' || p === 'middle' || p === 'normal') return 'priority-medium';
  return 'priority-low';
});

const viewTask = () => {
  router.push({ name: 'TaskDetails', params: { id: props.payload.TaskId } }) 
}
</script>

<style scoped>
.changelog-box {
  background-color: #ffffff;
  border: 1px dashed #fdba74;
  border-radius: 8px;
  padding: 12px 14px;
  margin-top: 10px;
}

.changelog-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  color: #ea580c;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.changelog-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 6px;
  flex-wrap: wrap; 
}

.changelog-item:last-child {
  margin-bottom: 0;
}

.change-label {
  font-weight: 600;
  color: #64748b;
  width: 85px;
  flex-shrink: 0;
}

.change-old {
  color: #94a3b8;
  text-decoration: line-through;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.change-arrow {
  width: 14px;
  height: 14px;
  color: #cbd5e1;
  margin: 0 8px;
}

.change-new {
  color: #ea580c;
  font-weight: 600;
  background: #fff7ed;
  padding: 2px 6px;
  border-radius: 4px;
}

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

.priority-medium {
  background-color: #fef9c3;
  color: #ca8a04;
}

.priority-low {
  background-color: #dcfce7;
  color: #16a34a;
}
</style>
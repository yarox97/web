<template>
  <div class="content-wrapper">
    
    <div class="header-bar">
      <div class="header-left">
        <h2>Calendar</h2>
        
        <div class="mode-toggle" v-if="canViewClubTasks">
          <button 
            class="mode-btn" 
            :class="{ active: activeView === 'my' }" 
            @click="activeView = 'my'"
          >
            My Tasks
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: activeView === 'club' }" 
            @click="activeView = 'club'"
          >
            Club Tasks
          </button>
        </div> 
        
        <div v-if="activeView === 'club' && canViewClubTasks && userClubs.length > 0" class="club-selector">
          <select v-model="selectedClubId" class="club-select">
            <option v-for="club in userClubs" :key="club.clubId || club.id" :value="club.clubId || club.id">
              {{ club.name || club.clubName || 'Unknown Club' }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="calendar-wrapper">
      <div v-if="isLoading" class="loader-overlay">
        <Spinner />
      </div>

      <FullCalendar 
        v-else 
        :options="calendarOptions" 
        class="custom-calendar"
      />
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

import { useAuthStore } from '@/stores/authStore'
import taskService from '@/modules/tasks/services/taskService'
import Spinner from '@/components/shared/Spinner.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoading = ref(true)

const activeView = ref('my')
const selectedClubId = ref(null)

const userClubs = computed(() => {
  return authStore.user?.clubDtos || authStore.user?.clubs || []
})

const canViewClubTasks = computed(() => {
  const user = authStore.user;
  if (!user) return false;
  
  if (user.role === 'Admin' || user.Role === 'Admin') return true;
  
  const allowedRoles = ['president', 'creator', 'coach'];
  
  return userClubs.value.some(club => {
    const role = (club.role || club.Role || '').toLowerCase();
    return allowedRoles.includes(role);
  });
})

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'en',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  buttonText: {
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day'
  },
  events: [], 
  eventClick: handleEventClick,
  height: '100%', 
  dayMaxEvents: true, 
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    meridiem: false,
    hour12: false
  }
})

const loadTasks = async () => {
  isLoading.value = true
  try {
    let allBasicTasks = []

    if (activeView.value === 'my') {
      const res = await taskService.getUserTasks(1, 100) 
      allBasicTasks = res.data?.value?.items || res.data?.items || res.data || []
    } else if (activeView.value === 'club' && selectedClubId.value) {
      const res = await taskService.getClubTasks(selectedClubId.value, 1, 100)
      allBasicTasks = res.data?.value?.items || res.data?.items || res.data || []
    }

    const uniqueIds = [...new Set(allBasicTasks.map(t => t.id))];

    if (uniqueIds.length === 0) {
      calendarOptions.value = { ...calendarOptions.value, events: [] };
      return;
    }

    const detailedTasksResponses = await Promise.all(
      uniqueIds.map(id => taskService.getTaskDetails(id))
    );

    const detailedTasks = detailedTasksResponses
      .map(res => res.data?.value || res.data)
      .filter(d => !!(d?.task || d)); 

    const events = detailedTasks.map(detail => {
      const task = detail.task || detail;
      
      const isCompleted = task.myStatus === 'Completed' || task.status === 'Completed';
      const isClubTask = task.clubId != null;

      let bgColor = isCompleted ? '#10b981' : (isClubTask ? '#8b5cf6' : '#0ea5e9');
      let borderColor = isCompleted ? '#059669' : (isClubTask ? '#7c3aed' : '#0284c7');

      const schedule = task.schedule || task.taskSchedule || {};
      
      let startStr = schedule.startDate || task.startDate;
      if (startStr && startStr.includes('T')) {
        startStr = startStr.split('T')[0]; 
      }
      if (startStr && schedule.startTime) {
        startStr = `${startStr}T${schedule.startTime}`; 
      }

      let endStr = schedule.endDate || task.endDate;
      if (endStr && endStr.includes('T')) {
        endStr = endStr.split('T')[0];
      }
      if (endStr && schedule.endTime) {
        endStr = `${endStr}T${schedule.endTime}`;
      }

      return {
        id: task.id,
        title: task.title || 'Untitled Task',
        start: startStr, 
        end: endStr,
        backgroundColor: bgColor,
        borderColor: borderColor,
        classNames: ['custom-task-event', isCompleted ? 'is-completed-event' : '']
      }
    }).filter(event => {
      if (!event.start) return false;
      return true;
    });

    calendarOptions.value = {
      ...calendarOptions.value,
      events: events
    };

  } catch (error) {
    console.error('Failed to load tasks for calendar:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleEventClick(clickInfo) {
  const taskId = clickInfo.event.id
  router.push({ name: 'TaskDetails', params: { id: taskId } })
}

watch([activeView, selectedClubId], () => {
  loadTasks()
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.checkAuth();
  }

  if (userClubs.value.length > 0) {
    selectedClubId.value = userClubs.value[0].clubId || userClubs.value[0].id;
  }
  
  loadTasks()
})
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 20px;
  background-color: white;
  border-radius: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-left h2 { 
  font-size: 1.5rem; 
  font-weight: 700; 
  color: var(--color-heading, #222);
  margin: 0; 
}

.mode-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
}

.mode-btn {
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.mode-btn:hover:not(.active) { 
  color: #334155; 
}

.mode-btn.active { 
  background: white; 
  color: var(--color-primary, #007bff); 
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
}

.club-selector {
  display: flex;
  align-items: center;
}

.club-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  color: #334155;
  font-weight: 500;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.club-select:focus {
  border-color: var(--color-primary, #007bff);
}

.calendar-wrapper {
  flex-grow: 1;
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  min-height: 0; 
  min-width: 0; 
  display: flex;
  flex-direction: column;
}

.loader-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 50;
  border-radius: 16px;
}

:deep(.custom-calendar) {
  flex-grow: 1;
  min-height: 0;
  width: 100%;
  font-family: inherit;
  color: #374151;
}

:deep(.fc-header-toolbar) {
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 1rem !important;
}

:deep(.fc-toolbar-title) {
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  color: #1f2937;
}

:deep(.fc-button) {
  text-transform: capitalize !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
  padding: 6px 12px !important;
  transition: all 0.2s ease !important;
}

:deep(.fc-button-primary) {
  background-color: #ffffff !important;
  color: #374151 !important;
  border: 1px solid #d1d5db !important;
}

:deep(.fc-button-primary:hover) {
  background-color: #f9fafb !important;
  color: #0ea5e9 !important;
}

:deep(.fc-button-primary:not(:disabled).fc-button-active) {
  background-color: #e0f2fe !important; 
  color: #0369a1 !important;
}

:deep(.fc-today-button) {
  background-color: #0ea5e9 !important;
  color: #ffffff !important;
}

:deep(.custom-task-event) {
  border-radius: 4px !important;
  padding: 2px 4px !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
  border: none !important;
  cursor: pointer !important;
}

:deep(.fc-theme-standard th) {
  padding: 10px 0 !important;
  background-color: #f9fafb !important;
  color: #4b5563 !important;
}

:deep(.fc-day-today) {
  background-color: #f0f9ff !important; 
}

:deep(.is-completed-event) {
  opacity: 0.5 !important;
  text-decoration: line-through !important;
  filter: grayscale(20%);
}

@media (max-width: 768px) {
  .header-bar { height: auto; flex-direction: column; padding: 15px; gap: 15px; }
  .header-left { width: 100%; flex-direction: column; align-items: stretch; gap: 12px; }
  .header-left h2 { text-align: center; }
  .mode-toggle { justify-content: space-between; }
  .mode-btn { flex: 1; text-align: center; }
  .club-selector { width: 100%; }
  .club-select { width: 100%; }
  .calendar-wrapper { padding: 10px; }
}
</style>
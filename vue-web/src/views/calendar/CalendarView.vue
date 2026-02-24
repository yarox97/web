<template>
  <div class="content-wrapper">
    
    <div class="header-bar">
      <div class="header-left">
        <h2>Calendar</h2>
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
import { ref, onMounted } from 'vue'
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
    // 1. Получаем базовые списки задач
    const userTasksPromise = taskService.getUserTasks(1, 100)
    
    const userClubs = authStore.user?.clubDtos || authStore.user?.clubs || []
    const clubTasksPromises = userClubs.map(club => 
      taskService.getClubTasks(club.clubId || club.id, 1, 100)
    )

    const [userTasksResponse, ...clubTasksResponses] = await Promise.all([
      userTasksPromise,
      ...clubTasksPromises
    ])

    const userTasksList = userTasksResponse.data?.value?.items || userTasksResponse.data?.items || userTasksResponse.data || []
    let allBasicTasks = [...userTasksList]
    
    clubTasksResponses.forEach(res => {
      const data = res.data?.value || res.data
      const tasks = data.items || data || []
      allBasicTasks = [...allBasicTasks, ...tasks]
    })

    // Оставляем только уникальные ID
    const uniqueIds = [...new Set(allBasicTasks.map(t => t.id))];

    // 2. Запрашиваем детали, чтобы получить список Receivers и статус
    const detailedTasksResponses = await Promise.all(
      uniqueIds.map(id => taskService.getTaskDetails(id))
    );

    // 3. ФИЛЬТРАЦИЯ: Оставляем только те задачи, где юзер — получатель
    const currentUserId = String(authStore.user?.id || authStore.user?.userId).toLowerCase();
    
    const detailedTasks = detailedTasksResponses
      .map(res => res.data?.value || res.data)
      .filter(d => {
        if (!d || !d.task || !d.receivers) return false;
        
        // Проверяем, есть ли текущий пользователь в списке получателей (Receivers)
        return d.receivers.some(r => 
          String(r.userId).toLowerCase() === currentUserId
        );
      });

    // 4. Маппим отфильтрованные детали в формат событий
    const events = detailedTasks.map(detail => {
      const task = detail.task;
      const receivers = detail.receivers || [];
      
      const myInfo = receivers.find(r => 
        String(r.userId).toLowerCase() === currentUserId
      );
      
      const isCompleted = myInfo?.taskStatus === 'Completed';
      const isClubTask = task.clubId != null;

      // Цвета: зеленый для выполненных, фиолетовый для клубных, голубой для личных
      let bgColor = isCompleted ? '#10b981' : (isClubTask ? '#8b5cf6' : '#0ea5e9');
      let borderColor = isCompleted ? '#059669' : (isClubTask ? '#7c3aed' : '#0284c7');

      const startDate = task.schedule?.startDate;
      const endDate = task.schedule?.endDate;
      let finalStart = startDate;
      let finalEnd = endDate;
      let isAllDay = true;

      if (startDate && task.schedule?.startTime) {
        finalStart = startDate.split('T')[0] + 'T' + task.schedule.startTime;
        isAllDay = false; 

        if (task.schedule?.endTime) {
          const endDay = endDate ? endDate.split('T')[0] : startDate.split('T')[0];
          finalEnd = endDay + 'T' + task.schedule.endTime;
        } else if (endDate) {
          finalEnd = endDate.split('T')[0] + 'T23:59:00';
        }
      }

      return {
        id: task.id,
        title: task.title || 'Untitled Task',
        start: finalStart, 
        end: finalEnd,
        allDay: isAllDay,
        backgroundColor: bgColor,
        borderColor: borderColor,
        classNames: ['custom-task-event', isCompleted ? 'is-completed-event' : '']
      }
    });

    calendarOptions.value.events = events;
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

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
/* Стили остаются прежними, добавляем только зачеркивание */
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

.header-left h2 { margin: 0; }

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

/* Визуальное отличие для выполненных задач */
:deep(.is-completed-event) {
  opacity: 0.5 !important;
  text-decoration: line-through !important;
  filter: grayscale(20%);
}

@media (max-width: 768px) {
  .header-bar { height: auto; flex-direction: column; padding: 15px; gap: 15px; }
  .header-left { width: 100%; text-align: center; }
  .calendar-wrapper { padding: 10px; }
}
</style>
<template>
  <div class="content-wrapper">
    <div class="header-bar">
      <div class="header-left">
        <h2>Tasks</h2>
        
        <div class="mode-toggle">
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'my' }" 
            @click="setViewMode('my')"
          >
            My Tasks
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: viewMode === 'club' }" 
            @click="setViewMode('club')"
          >
            Club Tasks
          </button>
        </div> 
        
        <div v-if="viewMode === 'club' && userClubs.length > 0" class="club-selector">
          <select v-model="selectedClubId" @change="onClubChange" class="club-select">
            <option v-for="club in userClubs" :key="club.clubId" :value="club.clubId">
              {{ club.clubName }}
            </option>
          </select>
          
          <button class="btn-create" @click="showCreateModal = true">
            + Create Task
          </button>
        </div>
      </div>
      
      <div class="header-center">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            class="search-input" 
            type="text" 
            placeholder="Search tasks by title or club..."
          >
        </div>
      </div>

      <div class="header-right"></div>
    </div>

    <div class="tabs-header">
      <button class="tab-btn" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
        All <span v-if="tasks.length" class="counter-badge">{{ tasks.length }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'in_progress' }" @click="activeTab = 'in_progress'">
        In Progress <span v-if="inProgressCount" class="counter-badge">{{ inProgressCount }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">
        Completed <span v-if="completedCount" class="counter-badge">{{ completedCount }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'failed' }" @click="activeTab = 'failed'">
        Failed <span v-if="failedCount" class="counter-badge">{{ failedCount }}</span>
      </button>
    </div>

    <div class="tasks-view">
      <div v-if="isLoading" class="loading-state">
        <Spinner />
      </div>

      <div v-else-if="error" class="empty-state">
        <p>{{ error }}</p>
        <button class="btn-retry" @click="fetchTasks">Try Again</button>
      </div>

      <div v-else-if="filteredTasks.length === 0" class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
        <p>No {{ activeTab.replace('_', ' ') }} tasks found.</p>
      </div>

      <div v-else class="tasks-grid">
        <TaskCard 
          v-for="task in filteredTasks" 
          :key="task.id" 
          :task="task" 
          @click="openTaskDetails(task.id)"
        />
      </div>

      <div v-if="totalPages > 1 && !searchQuery" class="pagination-footer">
        <button 
          class="page-btn nav-btn" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button 
          class="page-btn nav-btn" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </div>

    <CreateTaskModal 
      v-if="showCreateModal" 
      :club-id="selectedClubId" 
      :club-name="selectedClubName"
      @close="showCreateModal = false"
      @created="onTaskCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Spinner from '@/components/shared/Spinner.vue'
import TaskCard from '@/modules/tasks/components/TaskCard.vue'
import tasksService from "@/modules/tasks/services/taskService"
import CreateTaskModal from '@/modules/tasks/components/CreateTaskModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const tasks = ref([])
const isLoading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const activeTab = ref('all')

const viewMode = ref('my') 

// Список клубов пользователя из стора авторизации
const userClubs = computed(() => authStore.user?.clubDtos || [])
const selectedClubId = ref(null)

const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// ВЫЧИСЛЕНИЕ ВИДИМЫХ СТРАНИЦ ДЛЯ ПАГИНАЦИИ (макс. 5 кнопок подряд)
const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);
  
  // Корректировка, если мы находимся в начале или в конце
  if (current <= 2) {
    end = Math.min(total, 5);
  }
  if (current >= total - 1) {
    start = Math.max(1, total - 4);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
})

const priorityWeights = { 'Highest': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'Lowest': 1, 'None': 0 }

const inProgressCount = computed(() => tasks.value.filter(t => {
  const status = t.taskStatus || t.myStatus || 'Uncompleted'
  return status !== 'Completed' && status !== 'Failed'
}).length)

const completedCount = computed(() => tasks.value.filter(t => (t.taskStatus || t.myStatus) === 'Completed').length)
const failedCount = computed(() => tasks.value.filter(t => (t.taskStatus || t.myStatus) === 'Failed').length)

const filteredTasks = computed(() => {
  let result = [...tasks.value]

  if (activeTab.value === 'in_progress') {
    result = result.filter(t => {
      const status = t.taskStatus || t.myStatus || 'Uncompleted'
      return status !== 'Completed' && status !== 'Failed'
    })
  } else if (activeTab.value === 'completed') {
    result = result.filter(t => (t.taskStatus || t.myStatus) === 'Completed')
  } else if (activeTab.value === 'failed') {
    result = result.filter(t => (t.taskStatus || t.myStatus) === 'Failed')
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => t.title?.toLowerCase().includes(query) || t.clubName?.toLowerCase().includes(query))
  }

  result.sort((a, b) => {
    const statusA = a.taskStatus || a.myStatus || 'Uncompleted'
    const statusB = b.taskStatus || b.myStatus || 'Uncompleted'
    
    const isUncompletedA = (statusA !== 'Completed' && statusA !== 'Failed') ? 1 : 0
    const isUncompletedB = (statusB !== 'Completed' && statusB !== 'Failed') ? 1 : 0

    if (isUncompletedA !== isUncompletedB) return isUncompletedB - isUncompletedA 

    const priorityA = priorityWeights[a.taskPriority] || 0
    const priorityB = priorityWeights[b.taskPriority] || 0

    if (priorityA !== priorityB) return priorityB - priorityA 

    const dateA = a.schedule?.endDate ? new Date(a.schedule.endDate).getTime() : Infinity
    const dateB = b.schedule?.endDate ? new Date(b.schedule.endDate).getTime() : Infinity

    return dateA - dateB
  })

  return result
})

const setViewMode = (mode) => {
  if (viewMode.value === mode) return
  viewMode.value = mode
  currentPage.value = 1
  activeTab.value = 'all'
  fetchTasks()
}

const onClubChange = () => {
  currentPage.value = 1
  fetchTasks()
}

const fetchTasks = async () => {
  isLoading.value = true
  error.value = null

  try {
    let response;
    
    if (viewMode.value === 'my') {
      response = await tasksService.getUserTasks(currentPage.value, pageSize.value)
    } else {
      if (!selectedClubId.value) {
        throw new Error("Please select a club first.")
      }
      response = await tasksService.getClubTasks(selectedClubId.value, currentPage.value, pageSize.value)
    }

    const paginatedData = response.data?.value || response.data
    
    tasks.value = paginatedData.items || []
    totalItems.value = paginatedData.totalCount || 0
  } catch (err) {
    if (err.response?.status === 403) {
      error.value = "You don't have permission to view this club's tasks."
      tasks.value = []
    } else {
      error.value = err.message || err.response?.data?.message || 'Failed to load tasks. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  currentPage.value = newPage
  fetchTasks()
}

const openTaskDetails = (taskId) => {
  router.push(`/tasks/${taskId}`)
}

const showCreateModal = ref(false)
const selectedClubName = computed(() => {
  const club = userClubs.value.find(c => c.clubId === selectedClubId.value)
  return club ? club.clubName : ''
})

const onTaskCreated = () => {
  showCreateModal.value = false
  currentPage.value = 1
  fetchTasks()
}

onMounted(async () => {
  const queryMode = route.query.mode;
  const queryClubId = route.query.clubId;

  if (queryMode === 'club') {
    viewMode.value = 'club';
    
    if (queryClubId && userClubs.value.some(c => c.clubId === queryClubId)) {
      selectedClubId.value = queryClubId;
    } else if (userClubs.value.length > 0) {
      selectedClubId.value = userClubs.value[0].clubId;
    }
  } else {
    viewMode.value = 'my';
    if (userClubs.value.length > 0) {
      selectedClubId.value = userClubs.value[0].clubId;
    }
  }
  fetchTasks()
})
</script>

<style scoped>
.content-wrapper { 
  height: 100%; 
  display: flex; 
  flex-direction: column; 
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

.mode-btn:hover:not(.active) { color: #334155; }
.mode-btn.active { background: white; color: var(--color-primary, #007bff); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

/* Стили для выбора клуба */
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
}

.search-wrapper { position: relative; width: 320px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.5; }
.search-input { width: 100%; padding: 10px 10px 10px 35px; border: 1px solid #e0e0e0; border-radius: 12px; outline: none; background-color: #f9f9f9; box-sizing: border-box; transition: all 0.2s; }
.search-input:focus { border-color: var(--color-primary, #007bff); background: white; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }

.tabs-header { display: flex; gap: 10px; margin-bottom: 15px; padding: 0 10px; border-bottom: 1px solid #e0e0e0; overflow-x: auto; }
.tab-btn { background: none; border: none; padding: 10px 20px; font-size: 15px; font-weight: 500; color: #666; cursor: pointer; position: relative; transition: color 0.2s; white-space: nowrap; }
.tab-btn:hover { color: var(--color-primary, #007bff); }
.tab-btn.active { color: var(--color-primary, #007bff); font-weight: 600; }
.tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background-color: var(--color-primary, #007bff); }

.counter-badge { background: #eee; color: #333; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 6px; vertical-align: middle; }
.active .counter-badge { background: #e3f2fd; color: var(--color-primary, #007bff); }

.tasks-view { flex: 1; background-color: var(--gray, #f4f6f8); border-radius: 16px; padding: 20px; overflow-y: auto; }
.tasks-grid { display: flex; flex-direction: column; gap: 16px; }

.loading-state, .empty-state { height: 100%; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; text-align: center; }
.empty-state p { margin-top: 8px; font-size: 1.1rem; }
.btn-retry { margin-top: 16px; padding: 10px 24px; background: var(--color-primary, #007bff); color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: opacity 0.2s; }
.btn-retry:hover { opacity: 0.9; }

/* ОБНОВЛЕННЫЕ СТИЛИ ПАГИНАЦИИ */
.pagination-footer { margin-top: 30px; margin-bottom: 20px; display: flex; justify-content: center; align-items: center; gap: 8px; }
.page-numbers { display: flex; gap: 8px; }
.page-btn { 
  display: flex; align-items: center; justify-content: center;
  min-width: 36px; height: 36px; padding: 0 10px; 
  border: 1px solid #e2e8f0; background: white; border-radius: 8px; 
  font-size: 14px; font-weight: 600; color: #475569; 
  cursor: pointer; transition: all 0.2s; 
}
.page-btn:hover:not(:disabled):not(.active) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.page-btn.active { background: var(--color-primary, #007bff); color: white; border-color: var(--color-primary, #007bff); box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2); }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #f1f5f9; }
.nav-btn { color: #64748b; }

.btn-create {
  margin-left: 12px;
  background: var(--color-primary, #007bff);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.btn-create:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .header-bar { flex-direction: column; height: auto; padding: 16px; gap: 16px; align-items: stretch; }
  .header-left { flex-direction: column; align-items: flex-start; gap: 12px; }
  .search-wrapper { width: 100%; }
  .tabs-header { padding-bottom: 5px; }
}
</style>
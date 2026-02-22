<template>
  <div class="page-container">
    <div v-if="loading" class="state-box"><Spinner /></div>
    
    <div v-else-if="error" class="state-box error-box">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="goBack">Go Back</button>
    </div>

    <div v-else-if="taskData" class="task-content content-animate">
      
      <div class="nav-header">
        <button class="btn-back" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>

        <div class="admin-actions" v-if="canManageTask">
          <template v-if="!isEditing">
            <button class="btn-action edit" @click="startEditing">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon></svg>
              Edit Task
            </button>
            <button class="btn-action delete" @click="handleDelete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          </template>
          <template v-else>
            <button class="btn-action save" @click="saveChanges" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button class="btn-action cancel" @click="isEditing = false">Cancel</button>
          </template>
        </div>
      </div>

      <div class="layout-grid">
        <div class="main-column">
          
          <div class="card header-card">
            <div class="badges-row">
              <span class="badge type-badge">{{ taskData.task.taskType }}</span>
              <select v-if="isEditing" v-model="editForm.taskPriority" class="edit-input priority-select">
                <option value="None">None Priority</option>
                <option value="Lowest">Lowest</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Highest">Highest</option>
              </select>
              <span v-else class="badge" :class="getPriorityClass(taskData.task.taskPriority)">
                {{ taskData.task.taskPriority }} Priority
              </span>
            </div>
            
            <div class="title-container">
              <input v-if="isEditing" v-model="editForm.title" class="edit-input title-edit" placeholder="Task Title" />
              <h1 v-else class="task-title">{{ taskData.task.title }}</h1>
            </div>

            <div class="task-meta">
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Club: <strong>{{ taskData.task.clubName }}</strong>
              </div>
              <div class="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                From: <strong>{{ taskData.task.senderName }}</strong>
              </div>
            </div>
          </div>

          <div class="card section-card">
            <div class="section-header">
              <h3 class="section-title">Schedule & Details</h3>
              <span v-if="isOverdue && !isEditing" class="badge danger-badge">Overdue</span>
            </div>

            <div v-if="isEditing" class="edit-schedule-grid">
              <div class="form-group">
                <label>Start Date & Time</label>
                <div class="input-group">
                  <input type="date" v-model="editForm.startDate" class="edit-input" />
                  <input type="time" v-model="editForm.startTime" class="edit-input" />
                </div>
              </div>
              <div class="form-group">
                <label>Deadline Date & Time</label>
                <div class="input-group">
                  <input type="date" v-model="editForm.endDate" class="edit-input" />
                  <input type="time" v-model="editForm.endTime" class="edit-input" />
                </div>
              </div>
              <div class="form-group full-width">
                <label>Penalty for Failure</label>
                <div class="input-group penalty-group">
                  <select v-model="editForm.penaltyType" class="edit-input">
                    <option value="None">No Penalty</option>
                    <option value="Amount">Fixed Amount ($)</option>
                    <option value="Percent">Percentage (%)</option>
                  </select>
                  <input v-if="editForm.penaltyType !== 'None'" type="number" v-model="editForm.penaltyAmount" class="edit-input" placeholder="Amount" />
                </div>
              </div>
            </div>

            <div v-else class="timeline-widget">
              <div class="time-block">
                <div class="icon-circle start-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div class="time-info">
                  <span class="label">Starts</span>
                  <span class="date">{{ formatSimpleDate(taskData.task.schedule.startDate) }}</span>
                  <span class="time" v-if="taskData.task.schedule.startTime">{{ formatTime(taskData.task.schedule.startTime) }}</span>
                </div>
              </div>

              <div class="progress-section">
                <div class="progress-track">
                  <div class="progress-fill" :class="{'bg-danger': isOverdue}" :style="{ width: timelineProgress + '%' }"></div>
                  <div v-if="timelineProgress > 0 && timelineProgress < 100" class="progress-thumb" :style="{ left: timelineProgress + '%' }"></div>
                </div>
              </div>

              <div class="time-block align-right" :class="{'is-overdue': isOverdue}">
                <div class="time-info">
                  <span class="label">Deadline</span>
                  <template v-if="taskData.task.schedule.endDate">
                    <span class="date">{{ formatSimpleDate(taskData.task.schedule.endDate) }}</span>
                    <span class="time" v-if="taskData.task.schedule.endTime">{{ formatTime(taskData.task.schedule.endTime) }}</span>
                  </template>
                  <span class="date text-muted" v-else>No Limit</span>
                </div>
                <div class="icon-circle end-icon" :class="{'danger-icon': isOverdue}">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                </div>
              </div>
            </div>

            <div v-if="!isEditing && taskData.task.penaltyType !== 'None'" class="penalty-banner">
              <div class="penalty-icon">⚠️</div>
              <div class="penalty-content">
                <span class="penalty-label">Failure Penalty</span>
                <span class="penalty-value">{{ taskData.task.penaltyAmount }}{{ taskData.task.penaltyType === 'Percent' ? '%' : '$' }}</span>
              </div>
            </div>
          </div>

          <div class="card section-card">
            <h3 class="section-title">Description</h3>
            <div class="desc-content">
              <textarea v-if="isEditing" v-model="editForm.description" class="edit-input desc-textarea" rows="6" placeholder="Write task details here..."></textarea>
              <div v-else class="text-body">{{ taskData.task.description }}</div>
            </div>
            
            <div v-if="parsedPayload" class="payload-box">
              <component :is="currentPayloadComponent" :payload="parsedPayload" />
            </div>
          </div>

          <div class="card section-card">
            <div class="section-header">
              <h3 class="section-title">Attachments</h3>
              <button v-if="canManageTask" class="btn-secondary-small" @click="triggerFileInput">+ Add File</button>
              <input type="file" ref="fileInput" hidden multiple @change="handleFileUpload" />
            </div>
            
            <div v-if="taskData.task.attachments?.length > 0" class="attachments-grid">
              <a v-for="(file, index) in taskData.task.attachments" :key="index" :href="file.url" target="_blank" class="attachment-card">
                <div class="att-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                </div>
                <div class="att-info">
                  <span class="att-name" :title="file.fileName">{{ file.fileName }}</span>
                  <span class="att-size">{{ formatBytes(file.size) }}</span>
                </div>
              </a>
            </div>
            <div v-else class="empty-state">No attachments added to this task.</div>
          </div>

        </div>

        <div class="side-column">
          
          <div class="card receivers-card">
            <div class="section-header">
              <h3 class="section-title">
                {{ isSingleReceiver ? 'Status' : `Receivers (${taskData.receivers.length})` }}
              </h3>
              <button v-if="canManageTask" class="btn-secondary-small" @click="isEditingReceivers = true">Manage</button>
            </div>

            <div class="receivers-list">
              <div v-for="receiver in taskData.receivers" :key="receiver.userTaskId" 
                class="receiver-list-item" @click="openUserResponse(receiver)">
                
                <img :src="getAvatar(receiver.fullName)" class="receiver-avatar" />
                
                <div class="receiver-details">
                  <div class="receiver-name">
                    {{ receiver.fullName }}
                    <span v-if="receiver.userId === authStore.user?.id" class="text-muted">(You)</span>
                  </div>
                  <div v-if="receiver.completedAt" class="receiver-completed-date">
                    {{ formatSimpleDate(receiver.completedAt) }}
                  </div>
                </div>

                <div class="receiver-status">
                  <span class="status-indicator" :class="getStatusClass(receiver.taskStatus)"></span>
                  <span class="status-label">{{ formatStatus(receiver.taskStatus) }}</span>
                </div>
                
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" class="chevron"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </div>

          <div class="card response-card" v-if="myTaskReceiverData">
            <div class="section-header">
              <h3 class="section-title">My Response</h3>
              <span class="badge" :class="getStatusClass(myTaskReceiverData.taskStatus)">
                {{ formatStatus(myTaskReceiverData.taskStatus) }}
              </span>
            </div>

            <div v-if="myTaskReceiverData.taskStatus === 'Completed'" class="success-banner content-animate">
              <div class="success-icon">✓</div>
              <div class="success-text">
                <strong>You have successfully completed this task.</strong>
                <small v-if="myTaskReceiverData.completedAt">Submitted on: {{ formatSimpleDate(myTaskReceiverData.completedAt) }}</small>
              </div>
            </div>

            <div v-else>
              <div v-if="!showResponseForm" class="respond-prompt content-animate">
                <p class="text-muted mb-3">You have pending actions for this task.</p>
                
                <div class="vertical-actions">
                  <button class="btn-success w-100" @click="completeMyTask" :disabled="isCompletingTask">
                    {{ isCompletingTask ? 'Processing...' : '✔ Mark as Completed' }}
                  </button>
                  
                  <div class="divider-text"><span>OR</span></div>
                  
                  <button class="btn-secondary-outline w-100" @click="showResponseForm = true">
                    📎 Submit Files & Message
                  </button>
                </div>
              </div>

              <div v-else class="response-form content-animate">
                <textarea 
                  v-model="responseForm.text" 
                  class="edit-input desc-textarea" 
                  rows="4" 
                  placeholder="Type your answer or add comments here..."
                ></textarea>
                
                <div class="response-actions-sidebar">
                  <div class="file-upload-wrapper">
                    <button class="btn-secondary-small" @click="triggerResponseFileInput">+ Attach Files</button>
                    <input type="file" ref="responseFileInput" hidden multiple @change="handleResponseFileUpload" />
                    <span class="file-count" v-if="responseForm.files.length > 0">
                      {{ responseForm.files.length }} file(s)
                    </span>
                  </div>
                  
                  <div class="action-buttons-full">
                    <button class="btn-ghost text-muted flex-1" @click="showResponseForm = false">Cancel</button>
                    <button class="btn-action save flex-2" @click="submitMyResponse" :disabled="isSubmittingResponse">
                      {{ isSubmittingResponse ? 'Sending...' : 'Submit' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <UserResponseModal 
      v-if="selectedReceiver" 
      :receiver="selectedReceiver" 
      :task-title="taskData.task.title"
      :can-manage-task="canManageTask"
      @close="selectedReceiver = null" 
      @refresh="fetchTaskDetails"
    />
    
    <UpdateReceiversModal 
        v-if="isEditingReceivers" 
        :club-id="taskData.task.clubId" 
        :task-id="taskId"
        :current-ids="taskData.receivers.map(r => r.userId)"
        @close="isEditingReceivers = false"
        @updated="onReceiversUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'
import tasksService from '@/modules/tasks/services/taskService'
import Spinner from '@/components/shared/Spinner.vue'
import UserResponseModal from '@/modules/tasks/components/UserResponseModal.vue'
import UpdateReceiversModal from '@/modules/tasks/components/UpdateReceiversModal.vue'
import { getAvatar } from '@/utils/getAvatar'

import MatchPayload from '@/modules/tasks/payloadParse/MatchPayload.vue'
import SurveyPayload from '@/modules/tasks/payloadParse/SurveyPayload.vue'
import ActionPayload from '@/modules/tasks/payloadParse/ActionPayload.vue'
import DefaultPayload from '@/modules/tasks/payloadParse/DefaultPayload.vue'

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const taskId = route.params.id;
const taskData = ref(null);
const loading = ref(true);
const error = ref(null);

const isEditing = ref(false);
const isEditingReceivers = ref(false);
const isSaving = ref(false);
const selectedReceiver = ref(null);
const fileInput = ref(null);

// Форма редактирования таска
const editForm = ref({
  title: '', description: '', taskPriority: '',
  startDate: '', startTime: '', endDate: '', endTime: '',
  penaltyType: '', penaltyAmount: 0
});

// Состояние формы ответа
const showResponseForm = ref(false);
const isSubmittingResponse = ref(false);
const isCompletingTask = ref(false); // Для загрузки кнопки "Mark as Completed"
const responseFileInput = ref(null);
const responseForm = ref({
  text: '',
  files: []
});

// Проверка: является ли текущий юзер получателем этой задачи
const myTaskReceiverData = computed(() => {
  if (!taskData.value || !taskData.value.receivers) return null;
  return taskData.value.receivers.find(r => String(r.userId).toLowerCase() === String(authStore.user?.id).toLowerCase());
});

// Вычисляем роль пользователя в клубе
const myClubRole = computed(() => {
  const task = taskData.value?.task;
  const user = authStore.user;
  
  if (!user || !task) return null;

  const targetClubId = task?.clubId || task?.ClubId;
  if (!targetClubId || !user.clubDtos) return null;
  
  const clubMembership = user.clubDtos.find(c => String(c.clubId).toLowerCase() === String(targetClubId).toLowerCase());
  return clubMembership ? (clubMembership.role || clubMembership.Role) : null;
});

// Вычисляемые свойства доступа
const canManageTask = computed(() => {
  const task = taskData.value?.task;
  const user = authStore.user;
  if (!task || !user) return false;
  
  const senderId = task.senderId || task.SenderId;
  const isSender = Boolean(senderId && String(senderId).toLowerCase() === String(user.id).toLowerCase());
  
  const isGlobalAdmin = user.role === 'Admin' || user.Role === 'Admin';
  const role = myClubRole.value;
  const isClubAdmin = Boolean(role && ['president', 'creator', 'coach'].includes(String(role).toLowerCase()));
  
  return isSender || isGlobalAdmin || isClubAdmin;
});

const isSingleReceiver = computed(() => {
  if (!taskData.value?.receivers || !authStore.user?.id) return false;
  return taskData.value.receivers.length === 1 && String(taskData.value.receivers[0].userId).toLowerCase() === String(authStore.user.id).toLowerCase();
});

// Вспомогательная функция для склеивания даты и времени
const getFullDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':');
    date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date.getTime();
};

const isOverdue = computed(() => {
  const schedule = taskData.value?.task?.schedule;
  if (!schedule || !schedule.endDate) return false;
  const endTimestamp = getFullDateTime(schedule.endDate, schedule.endTime);
  const now = new Date().getTime();
  return now > endTimestamp;
});

const timelineProgress = computed(() => {
  const schedule = taskData.value?.task?.schedule;
  if (!schedule || !schedule.startDate || !schedule.endDate) return 0; 
  const start = getFullDateTime(schedule.startDate, schedule.startTime);
  const end = getFullDateTime(schedule.endDate, schedule.endTime);
  const now = new Date().getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
});

const parsedPayload = computed(() => {
  if (!taskData.value?.task?.payload) return null;
  try { return JSON.parse(taskData.value.task.payload); } 
  catch (e) { return null; }
});

const currentPayloadComponent = computed(() => {
  if (!taskData.value) return DefaultPayload;
  const typeMap = { 'Match': MatchPayload, 'Survey': SurveyPayload, 'Info': ActionPayload, 'DocumentSign': ActionPayload };
  return typeMap[taskData.value.task.taskType] || DefaultPayload;
});

const extractDate = (isoString) => isoString ? isoString.split('T')[0] : '';
const extractTime = (timeString) => timeString ? timeString.substring(0, 5) : '';

// --- ACTIONS (ADMIN) ---

const startEditing = () => {
  const t = taskData.value.task;
  editForm.value = {
    title: t.title,
    description: t.description,
    taskPriority: t.taskPriority,
    startDate: extractDate(t.schedule.startDate),
    startTime: extractTime(t.schedule.startTime),
    endDate: extractDate(t.schedule.endDate),
    endTime: extractTime(t.schedule.endTime),
    penaltyType: t.penaltyType,
    penaltyAmount: t.penaltyAmount || 0
  };
  isEditing.value = true;
};

const saveChanges = async () => {
  isSaving.value = true;
  try {
    const payload = {
      title: editForm.value.title,
      description: editForm.value.description,
      taskPriority: editForm.value.taskPriority,
      startDate: editForm.value.startDate,
      endDate: editForm.value.endDate || null,
      startTime: editForm.value.startTime + ':00', 
      endTime: editForm.value.endTime ? editForm.value.endTime + ':00' : null,
      penaltyType: editForm.value.penaltyType,
      penaltyAmount: editForm.value.penaltyType !== 'None' ? editForm.value.penaltyAmount : null
    };
    await tasksService.updateTaskDetails(taskId, payload);
    await fetchTaskDetails(); 
    isEditing.value = false;
  } catch (e) {
    alert("Failed to update task details");
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await tasksService.deleteTask(taskData.value.task.clubId, taskId);
    goBack();
  } catch (e) {
    alert("Failed to delete task");
  }
};

const triggerFileInput = () => fileInput.value.click();

const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  try {
    await tasksService.addAttachments(taskId, files);
    await fetchTaskDetails();
  } catch (e) {
    alert("Failed to upload files");
  }
};

// --- ACTIONS (USER RESPONSE) ---
const triggerResponseFileInput = () => responseFileInput.value.click();

const handleResponseFileUpload = (e) => {
  responseForm.value.files = Array.from(e.target.files);
};

// Кнопка Submit Response (Форма с текстом/файлами)
const submitMyResponse = async () => {
  isSubmittingResponse.value = true;
  try {
    await tasksService.submitResponse(taskId, responseForm.value.text, responseForm.value.files);
    responseForm.value = { text: '', files: [] };
    showResponseForm.value = false; 
    await fetchTaskDetails(); 
  } catch (e) {
    console.error(e);
    alert(e.response?.data?.message || "Failed to submit response.");
  } finally {
    isSubmittingResponse.value = false;
  }
};

// Кнопка быстрого завершения задачи (Дергает [HttpPut("{userTaskId}/complete")])
const completeMyTask = async () => {
  const userTaskId = myTaskReceiverData.value?.userTaskId;
  if (!userTaskId) return;
  
  isCompletingTask.value = true;
  try {
    await tasksService.completeUserTask(userTaskId);
    await fetchTaskDetails();
  } catch (e) {
    console.error(e);
    alert(e.response?.data?.message || "Failed to complete task.");
  } finally {
    isCompletingTask.value = false;
  }
};


// --- UTILS ---
const onReceiversUpdated = () => {
    isEditingReceivers.value = false;
    fetchTaskDetails();
};

const fetchTaskDetails = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/api/tasks/${taskId}`);
    taskData.value = res.data?.value || res.data;
  } catch (err) {
    error.value = "Task not found or access denied.";
  } finally {
    loading.value = false;
  }
};

const openUserResponse = (receiver) => { selectedReceiver.value = receiver; };

const goBack = () => {
  if (taskData.value?.task?.clubId) {
    router.push({ name: 'Tasks', query: { mode: 'club', clubId: taskData.value.task.clubId } });
  } else {
    router.push({ name: 'Tasks' });
  }
};

const formatSimpleDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (t) => t ? t.substring(0, 5) : '';
const formatBytes = (b) => (b / 1024).toFixed(1) + ' KB';

const getPriorityClass = (p) => {
  const map = { 'Highest': 'danger-badge', 'High': 'danger-badge', 'Medium': 'warning-badge', 'Low': 'success-badge', 'Lowest': 'success-badge' };
  return map[p] || 'default-badge';
};

const getStatusClass = (s) => {
  if(s === 'Completed') return 'status-success';
  if(s === 'Failed') return 'status-danger';
  return 'status-warning';
};

const formatStatus = (s) => s === 'Uncompleted' ? 'Pending' : s;

onMounted(async () => {
  await fetchTaskDetails();
  if (!authStore.isAuthenticated || !authStore.user) {
    await authStore.checkAuth();
  }
});
</script>

<style scoped>
/* PAGE & LAYOUT */
.page-container { 
  padding: 30px; 
  width: 100%;       
  box-sizing: border-box; 
  color: #1e293b; 
  font-family: 'Inter', system-ui, sans-serif; 
  min-height: calc(100vh - 80px); 
  background: #f8fafc;
}
.layout-grid { display: flex; gap: 30px; align-items: flex-start; }
.main-column { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
/* SIDE COLUMN УВЕЛИЧЕН */
.side-column { width: 440px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px; }

@media (max-width: 1024px) {
  .layout-grid { flex-direction: column; }
  .side-column { width: 100%; }
}

/* CARDS */
.card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
.header-card { border-top: 4px solid var(--color-primary, #007bff); padding-bottom: 30px; }
.section-card { margin-top: 0; }

/* HEADER & ACTIONS */
.nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.btn-back { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.btn-back:hover { background: #f1f5f9; color: #0f172a; }

.admin-actions { display: flex; gap: 10px; }
.btn-action { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; }
.btn-action.edit { background: #f1f5f9; color: var(--color-primary, #007bff); }
.btn-action.edit:hover { background: #e2e8f0; }
.btn-action.delete { background: #fef2f2; color: #ef4444; }
.btn-action.delete:hover { background: #fee2e2; }
.btn-action.save { background: var(--color-primary, #007bff); color: white; }
.btn-action.save:hover { opacity: 0.9; }
.btn-action.cancel { background: white; border: 1px solid #e2e8f0; color: #64748b; }

/* BADGES & TAGS */
.badges-row { display: flex; gap: 10px; margin-bottom: 15px; }
.badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.type-badge { background: #f1f5f9; color: #475569; }
.danger-badge { background: #fef2f2; color: #ef4444; }
.warning-badge { background: #fffbeb; color: #d97706; }
.success-badge { background: #f0fdf4; color: #16a34a; }
.default-badge { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

/* TASK MAIN INFO */
.title-container { margin-bottom: 16px; }
.task-title { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2; letter-spacing: -0.5px; }
.task-meta { display: flex; align-items: center; gap: 16px; color: #64748b; font-size: 0.95rem; flex-wrap: wrap; }
.meta-item { display: flex; align-items: center; gap: 6px; }

/* SECTION HEADERS */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0; }
.btn-secondary-small { background: white; border: 1px dashed #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
.btn-secondary-small:hover { background: #f1f5f9; border-color: #94a3b8; }

/* TIMELINE WIDGET */
.timeline-widget { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 10px; }
.time-block { display: flex; align-items: center; gap: 16px; min-width: 140px; }
.align-right { flex-direction: row-reverse; text-align: right; }

.icon-circle { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.start-icon { color: var(--color-primary, #007bff); border: 2px solid #e0f2fe; }
.end-icon { color: #64748b; border: 2px solid #e2e8f0; }
.end-icon.danger-icon { color: #ef4444; border-color: #fee2e2; }

.time-info { display: flex; flex-direction: column; gap: 4px; }
.label { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; }
.date { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
.time { font-size: 0.9rem; color: #64748b; font-weight: 500; }
.is-overdue .date, .is-overdue .time { color: #ef4444; }
.text-muted { color: #94a3b8; font-style: italic; font-weight: 500; }

.progress-section { flex: 1; margin: 0 24px; position: relative; }
.progress-track { height: 8px; background: #e2e8f0; border-radius: 4px; position: relative; }
.progress-fill { position: absolute; left: 0; top: 0; height: 100%; background: var(--color-primary, #007bff); border-radius: 4px; transition: width 0.3s ease; }
.progress-fill.bg-danger { background: #ef4444; }
.progress-thumb { 
  position: absolute; 
  top: 50%; 
  transform: translateY(-50%); /* Убрали translateX, чтобы left работал точно от края */
  margin-left: -8px; /* Центрируем ползунок относительно своего 'left' */
  width: 16px; 
  height: 16px; 
  background: white; 
  border: 4px solid var(--color-primary, #007bff); 
  border-radius: 50%; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
  transition: left 0.3s ease; 
}

/* PENALTY */
.penalty-banner { display: flex; align-items: center; gap: 12px; background: #fff1f2; border: 1px dashed #fecaca; padding: 16px 20px; border-radius: 12px; margin-top: 16px; }
.penalty-icon { font-size: 1.2rem; }
.penalty-content { display: flex; flex-direction: column; }
.penalty-label { font-size: 0.8rem; font-weight: 600; color: #9f1239; text-transform: uppercase; }
.penalty-value { font-size: 1.1rem; font-weight: 800; color: #e11d48; }

/* EDIT FORM GRIDS */
.edit-schedule-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 8px; }
.input-group { display: flex; gap: 10px; }
.full-width { grid-column: 1 / -1; }
.penalty-group { max-width: 400px; }

.edit-input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; font-family: inherit; outline: none; transition: border-color 0.2s; box-sizing: border-box; background: white; }
.edit-input:focus { border-color: var(--color-primary, #007bff); box-shadow: 0 0 0 3px rgba(0,123,255,0.1); }
.title-edit { font-size: 2rem; font-weight: 800; padding: 8px 12px; }
.desc-textarea { resize: vertical; min-height: 120px; line-height: 1.5; }
.priority-select { width: auto; padding: 4px 12px; font-weight: 600; }

/* DESCRIPTION & TEXT */
.text-body { font-size: 1.05rem; color: #334155; line-height: 1.6; white-space: pre-wrap; }
.payload-box { margin-top: 24px; padding-top: 24px; border-top: 1px dashed #e2e8f0; }

/* RESPONSE FORM (SIDEBAR SPECIFIC) */
.response-card { border-top: 4px solid #10b981; }
.respond-prompt { text-align: center; padding: 10px 0; }
.mb-3 { margin-bottom: 12px; }

.vertical-actions { display: flex; flex-direction: column; gap: 10px; }
.divider-text { text-align: center; color: #94a3b8; font-size: 0.75rem; font-weight: 700; margin: 5px 0; position: relative; text-transform: uppercase; }
.divider-text::before, .divider-text::after { content: ''; position: absolute; top: 50%; width: 40%; height: 1px; background: #e2e8f0; }
.divider-text::before { left: 0; }
.divider-text::after { right: 0; }
.btn-secondary-outline { background: transparent; border: 1px solid #cbd5e1; color: #475569; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-secondary-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }

.w-100 { width: 100%; display: flex; justify-content: center; align-items: center; }
.flex-1 { flex: 1; display: flex; justify-content: center; }
.flex-2 { flex: 2; display: flex; justify-content: center; }

.response-form { display: flex; flex-direction: column; gap: 15px; }
.response-actions-sidebar { display: flex; flex-direction: column; gap: 12px; margin-top: 5px; }
.file-upload-wrapper { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px dashed #e2e8f0; }
.file-count { font-size: 0.85rem; color: var(--color-primary, #007bff); font-weight: 600; }
.action-buttons-full { display: flex; gap: 10px; width: 100%; }

.btn-primary { background: var(--color-primary, #007bff); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn-primary:hover { opacity: 0.9; }
.btn-success { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-success:hover:not(:disabled) { background: #059669; }
.btn-success:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { background: transparent; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-ghost:hover { background: #f1f5f9; }

.success-banner { display: flex; align-items: center; gap: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px 20px; border-radius: 12px; color: #166534; }
.success-icon { background: #22c55e; color: white; width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; }
.success-text { display: flex; flex-direction: column; gap: 4px; }

/* ATTACHMENTS */
.attachments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.attachment-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: inherit; transition: all 0.2s; }
.attachment-card:hover { border-color: #cbd5e1; background: #f1f5f9; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.att-icon { color: var(--color-primary, #007bff); background: white; padding: 10px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.att-info { display: flex; flex-direction: column; overflow: hidden; }
.att-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.att-size { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
.empty-state { padding: 24px; text-align: center; color: #94a3b8; font-size: 0.95rem; font-style: italic; background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0; }

/* RECEIVERS SIDEBAR */
.receivers-list { display: flex; flex-direction: column; gap: 12px; }
.receiver-list-item { display: flex; align-items: center; gap: 14px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.receiver-list-item:hover { border-color: var(--color-primary, #007bff); background: #f0f7ff; transform: translateX(4px); }
.receiver-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.receiver-details { flex: 1; overflow: hidden; }
.receiver-name { font-size: 1rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.receiver-completed-date { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
.receiver-status { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: white; border-radius: 20px; border: 1px solid #e2e8f0; }
.status-indicator { width: 8px; height: 8px; border-radius: 50%; }
.status-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.status-success { background: #10b981; }
.status-danger { background: #ef4444; }
.status-warning { background: #f59e0b; }

.state-box { min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.error-icon { color: #ef4444; margin-bottom: 16px; }
.content-animate { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 600px) {
  .timeline-widget { flex-direction: column; align-items: flex-start; gap: 20px; }
  .progress-section { display: none; }
  .time-block.align-right { flex-direction: row; text-align: left; }
  .edit-schedule-grid { grid-template-columns: 1fr; }
  .input-group { flex-direction: column; }
  .action-buttons-full { flex-direction: column; }
}
</style>
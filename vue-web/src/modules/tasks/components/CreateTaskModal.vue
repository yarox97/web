<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Create Club Task</h3>
        <button class="close-btn" @click="close" type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="modal-body" v-if="!loadingMembers">
        
        <div class="steps-indicator">
          <div class="step" :class="{ 'active': currentStep >= 1, 'completed': currentStep > 1 }">
            <div class="step-num">1</div>
            <span class="step-label">Details</span>
          </div>
          <div class="step-line" :class="{ 'active-line': currentStep > 1 }"></div>
          <div class="step" :class="{ 'active': currentStep >= 2, 'completed': currentStep > 2 }">
            <div class="step-num">2</div>
            <span class="step-label">Schedule</span>
          </div>
          <div class="step-line" :class="{ 'active-line': currentStep > 2 }"></div>
          <div class="step" :class="{ 'active': currentStep >= 3 }">
            <div class="step-num">3</div>
            <span class="step-label">Audience</span>
          </div>
        </div>

        <form @submit.prevent="submitTask" class="task-form">
          
          <div v-show="currentStep === 1" class="step-content form-animate">
            <div class="form-group">
              <label>Title *</label>
              <input v-model="form.Title" type="text" class="input-field" placeholder="Task Title">
            </div>

            <div class="form-group">
              <label>Description *</label>
              <textarea v-model="form.Description" class="input-field" rows="3" placeholder="Task details..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Type *</label>
                <select v-model="form.TaskType" class="input-field">
                  <option value="Info">Info</option>
                  <option value="Match">Match</option>
                  <option value="Survey">Survey</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority *</label>
                <select v-model="form.TaskPriority" class="input-field">
                  <option value="None">None</option>
                  <option value="Lowest">Lowest</option>
                  <option value="Low">Low</option>
                  <option value="Middle">Middle</option>
                  <option value="High">High</option>
                  <option value="Highest">Highest</option>
                </select>
              </div>
            </div>

            <div v-if="form.TaskType === 'Match'" class="dynamic-fields">
              <div class="form-group">
                <label>Opponent Name</label>
                <input v-model="form.OpponentName" type="text" class="input-field" placeholder="e.g. Real Madrid">
              </div>
              <div class="form-group checkbox-group">
                <label>
                  <input v-model="form.IsHomeGame" type="checkbox"> Is Home Game?
                </label>
              </div>
              <div class="form-group">
                <label>Hall Address</label>
                <input v-model="form.HallAddress" type="text" class="input-field" placeholder="Stadium details">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Gathering Time</label>
                  <input v-model="form.GatheringTime" type="time" class="input-field">
                </div>
                <div class="form-group" v-if="!form.IsHomeGame">
                  <label>Departure Time</label>
                  <input v-model="form.DepartureTime" type="time" class="input-field">
                </div>
              </div>
              <div class="form-group">
                <label>Google Maps Link <span class="optional-tag">(Optional)</span></label>
                <input v-model="form.GoogleMapsLink" type="url" class="input-field" placeholder="Maps URL">
              </div>
            </div>

            <div v-if="form.TaskType === 'Survey'" class="dynamic-fields survey-fields">
              <div class="form-group">
                <label>Survey Embed Code (iframe) *</label>
                <div class="guide-box">
                  <p class="guide-text">
                    <strong>How to get the code?</strong><br>
                    In Google Forms: click <b>Send</b> → select the <b>&lt;&gt;</b> tab → <b>Copy</b> the HTML code.
                  </p>
                  <a href="https://support.google.com/docs/answer/2839588?hl=en" target="_blank" class="help-link">
                    Open official Google guide
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </a>
                </div>
                <textarea v-model="form.SurveyURL" class="input-field" rows="4" placeholder='<iframe src="https://docs.google.com/forms/..." ...></iframe>'></textarea>
              </div>
            </div>

            </div>

          <div v-show="currentStep === 2" class="step-content form-animate">
            <h4 class="section-title">Schedule</h4>

            <div class="form-row">
              <div class="form-group">
                <label>Date *</label>
                <input v-model="form.StartDate" type="date" class="input-field">
              </div>
            </div>

            <div class="form-row mt-3">
              <div class="form-group">
                <label>Start Time *</label>
                <input v-model="form.StartTime" type="time" class="input-field">
              </div>
              <div class="form-group">
                <label>End Time <span class="optional-tag">(Optional)</span></label>
                <input v-model="form.EndTime" type="time" class="input-field">
              </div>
            </div>

            <h4 class="section-title mt-4">Penalty / Bonus</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Type</label>
                <select v-model="form.PenaltyType" class="input-field">
                  <option value="None">None</option>
                  <option value="ValueFine">Value Penalty ($)</option>
                  <option value="PercentFine">Percent Penalty (%)</option>
                  <option value="ValuePremia">Value Bonus ($)</option>
                  <option value="PercentPremia">Percent Bonus (%)</option>
                </select>
              </div>
              <div class="form-group" v-if="form.PenaltyType !== 'None'">
                <label>Value / Percentage *</label>
                <input v-model="form.PenaltyAmount" type="number" step="0.01" class="input-field" placeholder="e.g. 50">
              </div>
            </div>
          </div>

          <div v-show="currentStep === 3" class="step-content form-animate">
            <div class="form-group mb-4">
              <h4 class="section-title">Attachments <span class="optional-tag">(Optional)</span></h4>
              <input type="file" @change="handleFileUpload" multiple class="file-input">
              <small class="hint-text">You can select multiple files</small>
            </div>

            <h4 class="section-title">Receivers ({{ form.Receivers.length }} selected) *</h4>
            <div class="receivers-section">
              <div class="quick-select">
                <button type="button" class="btn-tiny" @click="selectAll">All</button>
                <button type="button" class="btn-tiny" @click="selectByRole('Player')">Players</button>
                <button type="button" class="btn-tiny" @click="selectByRole('Staff')">Staff</button>
                <button type="button" class="btn-tiny btn-clear" @click="form.Receivers = []">Clear</button>
              </div>
              
              <div class="members-list">
                <label v-for="member in members" :key="member.userId" class="member-checkbox">
                  <input type="checkbox" :value="member.userId" v-model="form.Receivers">
                  <span class="member-name">{{ member.fullName || member.userName }}</span>
                  <span class="member-role">{{ member.role }}</span>
                </label>
              </div>
              <small v-if="form.Receivers.length === 0" class="error-text">Please select at least one receiver.</small>
            </div>
          </div>

          <div class="modal-footer">
            <div class="footer-left">
              <button type="button" class="btn-secondary" v-if="currentStep === 1" @click="close">Cancel</button>
              <button type="button" class="btn-secondary" v-else @click="prevStep">Back</button>
            </div>
            
            <div class="footer-right">
              <button 
                v-if="currentStep < 3" 
                type="button" 
                class="btn-primary" 
                @click="nextStep"
                :disabled="!isCurrentStepValid"
              >
                Next Step
              </button>
              
              <button 
                v-if="currentStep === 3" 
                type="submit" 
                class="btn-success" 
                :disabled="isSubmitting || form.Receivers.length === 0"
              >
                {{ isSubmitting ? 'Creating...' : 'Create Task' }}
              </button>
            </div>
          </div>

        </form>
      </div>
      <div v-else class="loading-box">
        <Spinner />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import tasksService from '@/modules/tasks/services/taskService'
import { useAuthStore } from '@/stores/authStore'
import Spinner from '@/components/shared/Spinner.vue'

const props = defineProps({
  clubId: { type: String, required: true },
  clubName: { type: String, required: true }
})

const emit = defineEmits(['close', 'created'])
const authStore = useAuthStore()

const loadingMembers = ref(true)
const isSubmitting = ref(false)
const members = ref([])

const currentStep = ref(1)

const form = ref({
  Title: '',
  Description: '',
  TaskType: 'Info',
  TaskPriority: 'Middle', 
  Receivers: [],
  StartDate: new Date().toISOString().split('T')[0],
  StartTime: '12:00',
  EndTime: '',
  PenaltyType: 'None',
  PenaltyAmount: null,
  Files: [],
  
  // Dynamic fields
  OpponentName: '',
  IsHomeGame: false,
  HallAddress: '',
  GatheringTime: '',
  DepartureTime: '',
  GoogleMapsLink: '',
  SurveyURL: ''
})

// Валидация шагов
const isCurrentStepValid = computed(() => {
  if (currentStep.value === 1) {
    if (!form.value.Title.trim()) return false;
    if (!form.value.Description.trim()) return false; 
    if (form.value.TaskType === 'Survey' && (!form.value.SurveyURL || !form.value.SurveyURL.trim())) return false;
    return true;
  }
  if (currentStep.value === 2) {
    if (!form.value.StartDate || !form.value.StartTime) return false;
    if (form.value.PenaltyType !== 'None' && !form.value.PenaltyAmount) return false;
    return true;
  }
  return true;
})

const nextStep = () => {
  if (isCurrentStepValid.value && currentStep.value < 3) currentStep.value++;
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
}

// Загрузка участников с исключением себя
const fetchMembers = async () => {
  try {
    const response = await api.get(`/api/${props.clubId}/members`)
    const currentUserId = authStore.user?.id || authStore.user?.Id;

    members.value = response.data
      .map(m => {
        const u = m.user || m.User || m;
        return {
          userId: m.userId || m.UserId || u.id || u.Id,
          userName: m.userName || m.UserName || u.userName,
          fullName: `${m.userFirstName || u.firstName || ''} ${m.userSurname || u.lastName || ''}`.trim(),
          role: m.role || m.Role || 'Member'
        }
      })
      .filter(m => m.userId !== currentUserId);
  } catch (e) {
    console.error("Failed to load members", e)
  } finally {
    loadingMembers.value = false
  }
}

const selectAll = () => {
  form.value.Receivers = members.value.map(m => m.userId)
}
const selectByRole = (role) => {
  const roleIds = members.value
    .filter(m => String(m.role).toLowerCase() === role.toLowerCase())
    .map(m => m.userId)
  form.value.Receivers = [...new Set([...form.value.Receivers, ...roleIds])]
}

const handleFileUpload = (event) => {
  form.value.Files = Array.from(event.target.files)
}

const formatAsUtc = (dateStr) => {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00Z`).toISOString();
};

const submitTask = async () => {
  isSubmitting.value = true
  const formData = new FormData()

  formData.append('Title', form.value.Title)
  formData.append('Description', form.value.Description)
  formData.append('TaskType', form.value.TaskType)
  formData.append('TaskPriority', form.value.TaskPriority)
  formData.append('ClubId', props.clubId)
  formData.append('ClubName', props.clubName)
  formData.append('SenderName', authStore.user?.firstName || authStore.user?.userName || 'Admin')
  formData.append('SenderSurname', authStore.user?.lastName || '')
  formData.append('StartDate', formatAsUtc(form.value.StartDate))
  formData.append('StartTime', form.value.StartTime + ':00')
  formData.append('EndTime', (form.value.EndTime || '23:59') + ':00')
  form.value.Receivers.forEach(id => formData.append('Receivers', id))
  formData.append('penaltyType', form.value.PenaltyType)
  if (form.value.PenaltyType !== 'None' && form.value.PenaltyAmount) {
    formData.append('PenaltyAmount', form.value.PenaltyAmount)
  }
  if (form.value.TaskType === 'Info') {
    formData.append('ConfirmationButtonText', 'Confirm') 
  }
  if (form.value.TaskType === 'Match') {
    formData.append('OpponentName', form.value.OpponentName || '')
    formData.append('IsHomeGame', form.value.IsHomeGame ? 'true' : 'false')
    formData.append('HallAddress', form.value.HallAddress || '')
    if(form.value.GatheringTime) formData.append('GatheringTime', form.value.GatheringTime + ':00')
    if(!form.value.IsHomeGame && form.value.DepartureTime) formData.append('DepartureTime', form.value.DepartureTime + ':00')
    formData.append('GoogleMapsLink', form.value.GoogleMapsLink || '')
  }
  if (form.value.TaskType === 'Survey') {
    formData.append('SurveyURL', form.value.SurveyURL)
  }
  form.value.Files.forEach(file => formData.append('Files', file))

  try {
    await tasksService.createTask(props.clubId, formData)
    emit('created')
  } catch (e) {
    alert(e.response?.data?.message || "Failed to create task.")
  } finally {
    isSubmitting.value = false
  }
}

const close = () => emit('close')
onMounted(fetchMembers)
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s; padding: 20px; box-sizing: border-box; }
.modal-card { background: white; border-radius: 16px; width: 650px; max-width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.modal-header h3 { margin: 0; font-size: 1.25rem; color: #0f172a; }
.close-btn { background: none; border: none; color: #64748b; cursor: pointer; transition: color 0.2s; display: flex; align-items: center; justify-content: center; padding: 0; }
.close-btn:hover { color: #0f172a; }
.modal-body { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; }
.loading-box { min-height: 300px; display: flex; justify-content: center; align-items: center; }

/* STEPS INDICATOR */
.steps-indicator { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding: 0 20px; }
.step { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #94a3b8; transition: all 0.3s; position: relative; }
.step-num { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; border: 2px solid transparent; }
.step-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.step.active { color: #007bff; }
.step.active .step-num { background: #eff6ff; border-color: #007bff; color: #007bff; }
.step.completed { color: #10b981; }
.step.completed .step-num { background: #10b981; color: white; border-color: #10b981; }
.step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 15px; position: relative; top: -10px; transition: background 0.3s; }
.step-line.active-line { background: #10b981; }

.step-content { display: flex; flex-direction: column; gap: 16px; }
.form-animate { animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

.section-title { margin: 0; font-size: 1rem; color: #334155; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
.mt-4 { margin-top: 16px; }
.mb-4 { margin-bottom: 24px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-row { display: flex; gap: 16px; }
.form-row .form-group { flex: 1; }
label { font-size: 0.85rem; font-weight: 600; color: #475569; }
.optional-tag { font-weight: normal; color: #94a3b8; font-size: 0.75rem; margin-left: 4px; }
.input-field { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #1e293b; outline: none; transition: border-color 0.2s; font-family: inherit; }
.input-field:focus { border-color: #007bff; box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }
.hint-text { font-size: 0.8rem; color: #94a3b8; }
.error-text { color: #ef4444; font-size: 0.85rem; margin-top: 5px; display: block; }

/* Dynamic Content */
.dynamic-fields { display: flex; flex-direction: column; gap: 16px; background: #f0fdf4; border: 1px dashed #86efac; padding: 16px; border-radius: 8px; }

/* Guide for Survey */
.guide-box { background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #dcfce7; margin-bottom: 8px; }
.guide-text { font-size: 0.8rem; color: #166534; line-height: 1.4; margin: 0 0 6px 0; }
.help-link { font-size: 0.8rem; color: #007bff; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
.help-link:hover { text-decoration: underline; }

/* Receivers Selection */
.receivers-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.quick-select { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-tiny { background: white; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
.btn-tiny:hover { background: #f1f5f9; border-color: #94a3b8; }
.btn-clear { color: #ef4444; border-color: #fca5a5; }
.btn-clear:hover { background: #fef2f2; }
.members-list { display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto; padding-right: 10px; }
.member-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s; border: 1px solid transparent; }
.member-checkbox:hover { background: white; border-color: #e2e8f0; }
.member-name { font-weight: 500; color: #1e293b; flex: 1; }
.member-role { font-size: 0.75rem; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 12px; font-weight: 600; text-transform: uppercase; }

/* FOOTER NAV */
.modal-footer { padding: 20px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
.footer-right { display: flex; gap: 12px; }

.btn-primary { background: #0f172a; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn-success { background: #007bff; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
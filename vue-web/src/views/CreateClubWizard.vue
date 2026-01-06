<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router'; 
import { useAuthStore } from '@/stores/authStore';
import { clubService } from '@/services/clubService';

const router = useRouter(); 
const authStore = useAuthStore(); 

const currentStep = ref(1);
const totalSteps = 3;
const isSubmitting = ref(false);

const formData = reactive({
  name: '',
  description: '',
  avatarUrl: '',
  backgroundUrl: '',
  volleyboxUrl: ''
});

const errors = reactive({
  name: '',
  description: ''
});

const progressPercentage = computed(() => {
  return ((currentStep.value - 1) / (totalSteps - 1)) * 100;
});

const isLastStep = computed(() => currentStep.value === totalSteps);

const volleyboxId = computed(() => {
  if (!formData.volleyboxUrl) return '';
  const match = formData.volleyboxUrl.match(/-t(\d+)/);
  return match ? match[1] : null;
});

const validateStep = (step) => {
  let isValid = true;
  errors.name = '';
  errors.description = '';

  if (step === 1) {
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'Name must consist of at least 3 symbols';
      isValid = false;
    }
    if (!formData.description) {
      errors.description = 'Description is required';
      isValid = false;
    }
  }
  return isValid;
};

const nextStep = () => {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < totalSteps) currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const submitForm = async () => {
  isSubmitting.value = true;

  const currentUser = authStore.user;

  if (!currentUser) {
      alert("User not found. Please relogin.");
      isSubmitting.value = false;
      return;
  }

  const payload = {
    creatorId: currentUser.id || currentUser.Id, 
    name: formData.name,
    description: formData.description,
    avatarURL: formData.avatarUrl,
    backGroundURL: formData.backgroundUrl,
    volleyboxUrl: volleyboxId.value 
  }; 

  try {
    const data = await clubService.createClub(payload);
    
    if (data && (data.isSuccess || data.value)) {
      router.push({ name: 'Clubs' });
    } else {
        console.error(data);
    }
  } catch (error) {
     console.error(error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="page-wrapper">
    <div class="wizard-card">
      
      <div class="progress-section">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <div class="steps-labels">
          <span :class="{ active: currentStep >= 1 }">Info</span>
          <span :class="{ active: currentStep >= 2 }">Links</span>
          <span :class="{ active: currentStep >= 3 }">Result</span>
        </div>
      </div>

      <form @submit.prevent="isLastStep ? submitForm() : nextStep()" class="wizard-form">
        
        <div class="form-content-area">
          <transition name="fade" mode="out-in">
            
            <div v-if="currentStep === 1" key="step1" class="step-pane">
              <div class="step-header">
                <h2>Create your own club</h2>
                <p>Please provide name and description of your team</p>
              </div>

              <div class="form-group">
                <label>Club's name <span class="required">*</span></label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  placeholder="e.g. Volley Masters" 
                  :class="{ 'has-error': errors.name }"
                  autofocus
                />
                <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
              </div>

              <div class="form-group">
                <label>Description <span class="required">*</span></label>
                <textarea 
                  v-model="formData.description" 
                  placeholder="Tell us something about your club..."
                  :class="{ 'has-error': errors.description }"
                  rows="4"
                ></textarea>
                <span v-if="errors.description" class="error-msg">{{ errors.description }}</span>
              </div>
            </div>

            <div v-else-if="currentStep === 2" key="step2" class="step-pane">
              <div class="step-header">
                <h2>Links</h2>
                <p>Make your club recognizable.</p>
              </div>

              <div class="form-group">
                <label>VolleyBox Profile URL</label>
                <input 
                  v-model="formData.volleyboxUrl" 
                  type="text" 
                  placeholder="https://volleybox.net/your-club-t12345" 
                />
                <p class="helper-text">Paste the full URL, we will extract the ID automatically.</p>
                
                <div v-if="volleyboxId" class="id-badge">
                  Club ID: <strong>{{ volleyboxId }}</strong>
                </div>
              </div>
            </div>

            <div v-else-if="currentStep === 3" key="step3" class="step-pane">
              <div class="step-header">
                <h2>Is everything correct?</h2>
                <p>Check your club data before creation.</p>
              </div>

              <div class="summary-box">
                <div class="summary-row">
                  <span class="label">Name</span>
                  <span class="value main-value">{{ formData.name }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">Description</span>
                  <span class="value">{{ formData.description }}</span>
                </div>
                
                <div class="summary-row" v-if="volleyboxId">
                   <span class="label">VolleyBox ID</span>
                   <span class="value">{{ volleyboxId }}</span>
                </div>

                <div class="summary-row" v-if="formData.avatarUrl">
                  <span class="label">Avatar</span>
                  <a :href="formData.avatarUrl" target="_blank" class="link-value">Open link</a>
                </div>
              </div>
            </div>

          </transition>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            @click="prevStep" 
            class="btn btn-secondary"
            :class="{ invisible: currentStep === 1 }"
            :disabled="isSubmitting"
          >
            Back
          </button>

          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="loader"></span>
            <span v-else>{{ isLastStep ? 'Create club' : 'Next step' }}</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100%;
  padding: 40px 20px;
  background-color: transparent;
  font-family: 'Segoe UI', sans-serif;
  color: #1f2937;
}

.wizard-card {
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* --- Прогресс бар --- */
.progress-section {
  padding: 30px 40px 10px 40px;
}

.progress-track {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.steps-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
}

.steps-labels span.active {
  color: #0ea5e9;
  font-weight: 700;
}

/* --- Контент формы --- */
.form-content-area {
  padding: 20px 40px;
  min-height: 320px;
}

.step-header {
  margin-bottom: 25px;
  text-align: center;
}

.step-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #111827;
}

.step-header p {
  color: #6b7280;
  margin: 0;
  font-size: 0.95rem;
}

/* --- Поля ввода (Inputs) --- */
.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #374151;
}

.required {
  color: #ef4444;
}

input, textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: #f9fafb;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #0ea5e9;
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15);
}

.has-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.error-msg {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 6px;
  display: block;
}

.helper-text {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 5px;
}

/* --- Стили для виджета и бейджа ID --- */
.id-badge {
  margin-top: 8px;
  font-size: 0.9rem;
  color: #059669; /* Green-600 */
  background: #d1fae5;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}

.widget-preview {
  margin-top: 20px;
  background: #f8fafc;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.iframe-container {
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  background: white;
}

/* --- Summary Box (Итоги) --- */
.summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap; /* Важно для iframe внутри summary */
}

.summary-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.summary-row .label {
  color: #64748b;
  font-size: 0.9rem;
}

.summary-row .value {
  font-weight: 600;
  text-align: right;
  max-width: 70%;
}

.main-value {
  color: #0ea5e9;
  font-size: 1.1rem;
}

.link-value {
  color: #0ea5e9;
  text-decoration: none;
  font-size: 0.9rem;
}

/* --- Кнопки --- */
.form-actions {
  padding: 20px 40px 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f3f4f6;
}

.btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #0ea5e9;
  color: white;
  box-shadow: 0 4px 6px rgba(14, 165, 233, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #0284c7;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background-color: #f9fafb;
  color: #374151;
}

.invisible {
  visibility: hidden;
}

/* --- Анимации --- */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* --- Мобильная адаптивность --- */
@media (max-width: 640px) {
  .page-wrapper {
    padding: 10px;
    align-items: stretch;
  }

  .wizard-card {
    max-width: none;
    border-radius: 0;
    height: 100%;
    justify-content: space-between;
  }

  .form-content-area {
    padding: 20px;
    flex-grow: 1;
  }

  .progress-section {
    padding: 20px 20px 0 20px;
  }

  .form-actions {
    padding: 20px;
  }

  h2 {
    font-size: 1.25rem;
  }
}
</style>
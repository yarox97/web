<template>
  <div class="payload-content">
    <div class="payload-header">
      <h4 class="payload-title">Survey</h4>
    </div>
    
    <p class="payload-text">Please complete the survey required for this task.</p>
    
    <div 
      class="iframe-wrapper" 
      v-html="iframeHtml"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  payload: { type: Object, required: true }
})

// Получаем строку с тегом <iframe>
const iframeHtml = computed(() => props.payload.surveyUrl || props.payload.SurveyUrl)
</script>

<style scoped>
.payload-header {
  margin-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.payload-title { 
  font-size: 1.05rem; 
  margin: 0; 
  color: #0f172a; 
}

.payload-text { 
  color: #475569; 
  margin-bottom: 16px; 
  font-size: 0.95rem; 
}

/* Контейнер для iframe */
.iframe-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* Используем :deep(), чтобы стили применились к iframe, 
  который Vue вставит динамически через v-html.
  Это перебьет жесткие размеры от Google (например width="640")
*/
.iframe-wrapper :deep(iframe) {
  width: 100% !important;
  min-height: 600px; /* Минимальная высота для удобства */
  border: none !important;
  display: block;
}

@media (max-width: 768px) {
  .iframe-wrapper :deep(iframe) {
    min-height: 500px;
  }
}
</style>
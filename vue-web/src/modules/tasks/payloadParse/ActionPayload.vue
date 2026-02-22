<template>
  <div class="payload-content">
    <h4 class="payload-title">Action Required</h4>
    <p class="payload-text">
      To complete this task, you will need to click: 
      <strong>"{{ btnText }}"</strong>
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  payload: { type: Object, required: true }
})

const btnText = computed(() => props.payload.ConfirmationButtonText || props.payload.confirmationButtonText || 'Confirm')
</script>

<style scoped>
.payload-title { font-size: 1.05rem; margin: 0 0 16px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
.payload-text { color: #475569; margin-bottom: 12px; font-size: 0.95rem; }
</style>
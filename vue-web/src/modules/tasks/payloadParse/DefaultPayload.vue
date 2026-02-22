<template>
  <div class="payload-content">
    <h4 class="payload-title">Additional Data</h4>
    <pre class="raw-data">{{ payload }}</pre>
  </div>
</template>

<script setup>
defineProps({
  payload: { type: Object, required: true }
})
</script>

<style scoped>
.payload-title { font-size: 1.05rem; margin: 0 0 16px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
.raw-data { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 0.85rem; color: #334155; overflow-x: auto; }
</style>
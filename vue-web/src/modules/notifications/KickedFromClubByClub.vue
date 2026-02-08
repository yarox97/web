<template>
  <div class="notification-body warning-theme">
    <div class="icon-area">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    </div>
    <div class="content-area">
      <h4 class="title">Kick from club</h4>
      <p class="description">
        You were kicked from club <strong>{{ payload.ClubName }}</strong> by administration.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({ payload: Object })
const router = useRouter()
</script>
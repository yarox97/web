<template>
  <div class="notification-body request-theme">
    <div class="icon-area">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    </div>
    <div class="content-area">
      <h4 class="title">New join request for club {{ payload.ClubName }}</h4>
      <p class="description">
        <strong>{{ payload.SenderName || payload.Name }} {{ payload.SenderSurname || payload.Surname }}</strong> wants to join club <span class="highlight">{{ payload.ClubName }}</span>.
      </p>
      <div class="actions">
        <button class="btn btn-primary" @click="goToRequests">
          Review request
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({ payload: Object })
const router = useRouter()

const goToRequests = () => {
  router.push({ 
    name: 'ClubDetails', 
    params: { id: props.payload.ClubId }, 
    query: { tab: 'requests' } 
  })
}
</script>
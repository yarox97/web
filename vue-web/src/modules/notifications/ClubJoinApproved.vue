<template>
  <div class="notification-body success-theme">
    <div class="icon-area">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div class="content-area">
      <h4 class="title">Welcome!</h4>
      <p class="description">
        Your request to join club <strong>{{ payload.ClubName }}</strong> has been approved.<br />You are now an official member.
      </p>
      <div class="actions">
        <button class="btn btn-success" @click="goToClub">
          Go to club page
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({ payload: Object })
const router = useRouter()

const goToClub = () => {
  router.push({ name: 'ClubDetails', params: { id: props.payload.ClubId } })
}
</script>
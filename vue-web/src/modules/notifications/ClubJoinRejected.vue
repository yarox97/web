<template>
  <div class="notification-body error-theme">
    <div class="icon-area">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div class="content-area">
      <h4 class="title">Join Request Rejected</h4>
      <p class="description">
        Unfortunately, club <strong>{{ payload.ClubName }}</strong> has rejected your join request.
      </p>
      <div class="actions">
        <button class="btn btn-outline-danger" @click="findOtherClubs">
          Find other clubs
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({ payload: Object })
const router = useRouter()

const findOtherClubs = () => {
  router.push({ name: 'clubs' })
}
</script>
<template>
  <div class="notification-body contract-theme">
    <div class="icon-area">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <div class="content-area">
      <h4 class="title">New contract</h4>
      <p class="description">
        You have been assigned a contract in club <strong>{{ payload.ClubName }}</strong>.
        <br>
        <span class="meta-info">Assigned by: {{ payload.AssignerName || payload.Name }} {{ payload.AssignerSurname || payload.Surname }}</span>
      </p>
      <div class="actions">
        <button class="btn btn-purple" @click="viewContract">
          View contract details
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({ payload: Object })
const router = useRouter()

const viewContract = () => {
  router.push({ name: 'MyContracts', query: { clubId: props.payload.ClubId } })
}
</script>
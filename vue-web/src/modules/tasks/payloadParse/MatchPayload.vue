<template>
  <div class="payload-content">
    <h4 class="payload-title">Match Details</h4>
    <div class="payload-grid">
      <div class="payload-item">
        <span class="p-label">Opponent:</span>
        <span class="p-value fw-bold">{{ payload.OpponentName || payload.opponentName }}</span>
      </div>
      <div class="payload-item">
        <span class="p-label">Location:</span>
        <span class="p-value">
          <span class="game-type-badge" :class="isHome ? 'badge-home' : 'badge-away'">
            {{ isHome ? 'Home Game' : 'Away Game' }}
          </span>
        </span>
      </div>
      <div class="payload-item">
        <span class="p-label">Hall Address:</span>
        <span class="p-value">{{ payload.HallAddress || payload.hallAddress }}</span>
      </div>
      <div class="payload-item" v-if="gatheringTime">
        <span class="p-label">Gathering Time:</span>
        <span class="p-value">{{ gatheringTime }}</span>
      </div>
      <div class="payload-item" v-if="departureTime">
        <span class="p-label">Departure Time:</span>
        <span class="p-value">{{ departureTime }}</span>
      </div>
      <div class="payload-item full-width" v-if="mapLink">
        <span class="p-label">Map:</span>
        <a :href="mapLink" target="_blank" class="external-link">
          Open in Google Maps 
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  payload: { type: Object, required: true }
})

const isHome = computed(() => props.payload.IsHomeGame || props.payload.isHomeGame)
const gatheringTime = computed(() => props.payload.GatheringTime || props.payload.gatheringTime)
const departureTime = computed(() => props.payload.DepartureTime || props.payload.departureTime)
const mapLink = computed(() => props.payload.GoogleMapsLink || props.payload.googleMapsLink)
</script>

<style scoped>
.payload-title { font-size: 1.05rem; margin: 0 0 16px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
.payload-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.payload-item { display: flex; flex-direction: column; gap: 4px; }
.full-width { grid-column: 1 / -1; }
.p-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
.p-value { color: #1e293b; font-size: 1rem; }
.fw-bold { font-weight: 700; }
.game-type-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
.badge-home { background-color: #e0f2fe; color: #0284c7; }
.badge-away { background-color: #fce7f3; color: #be185d; }
.external-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary, #007bff); text-decoration: none; font-weight: 500; }
.external-link:hover { text-decoration: underline; }
</style>
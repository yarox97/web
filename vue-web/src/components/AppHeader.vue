<script setup>
defineEmits(['toggle-sidebar']);
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button class="burger-btn" @click="$emit('toggle-sidebar')">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <span class="page-title">
        <router-link to="/app/cockpit">
          VolleyMS
        </router-link>
      </span>
    </div>

    <div class="header-right">
      </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.burger-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #374151;
  padding: 4px;
  display: none;
}

@media (max-width: 768px) {
  .burger-btn {
    display: block;
  }
  .app-header {
    padding: 0 15px;
  }
}

.page-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #111827;
}

.page-title a {
  text-decoration: none;
  color: inherit;
}
</style>
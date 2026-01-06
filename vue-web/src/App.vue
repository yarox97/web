<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import Spinner from './components/shared/Spinner.vue';

const authStore = useAuthStore();

</script>

<template>
  <div v-if="authStore.isLoading" class="app-loading">
    <Spinner />
    <span>Loading VolleyMS...</span>
  </div>

  <router-view v-else />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f3f4f6; 
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

*, *::before, *::after {
  box-sizing: border-box;
}
</style>

<style scoped>
.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  font-size: 1.2rem;
  color: #555;
  gap: 15px;
}
</style>
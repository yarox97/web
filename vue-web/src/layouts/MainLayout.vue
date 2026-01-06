<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/shared/AppHeader.vue'
import AppSidebar from '@/components/shared/AppSidebar.vue';

const isMobileMenuOpen = ref(false);
const router = useRouter();

const toggleSidebar = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeSidebar = () => {
  isMobileMenuOpen.value = false;
};

router.afterEach(() => {
  isMobileMenuOpen.value = false;
});
</script>

<template>
  <div class="layout-container">
    
    <div 
      class="mobile-overlay" 
      :class="{ 'show': isMobileMenuOpen }"
      @click="closeSidebar"
    ></div>

    <aside class="sidebar" :class="{ 'mobile-open': isMobileMenuOpen }">
      <AppSidebar @close-sidebar="closeSidebar" />
    </aside>

    <div class="main-wrapper">
      <AppHeader @toggle-sidebar="toggleSidebar" />
      
      <main class="content-area">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f3f4f6;
  position: relative;
  overflow: hidden;
}

.main-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  position: relative;
}

.content-area {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.sidebar {
  width: 260px;
  height: 100%;
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;
  z-index: 50;
}

.mobile-overlay {
  display: none;
}

@media (max-width: 768px) {
  
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    width: 280px;
    height: 100%;
    z-index: 1000;
    box-shadow: 5px 0 15px rgba(0,0,0,0.2);
    
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .mobile-overlay {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 900;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease;
  }

  .mobile-overlay.show {
    opacity: 1;
    visibility: visible;
  }
}
</style>
<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const errorCode = computed(() => route.params.code || '404');

const errorContent = {
  '404': {
    title: 'Page Not Found',
    message: 'Oops! The page you are looking for might have been removed or is temporarily unavailable.',
    icon: 'search'
  },
  '403': {
    title: 'Access Denied',
    message: 'You do not have permission to view this page. Please contact your administrator.',
    icon: 'lock'
  },
  '500': {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    icon: 'server'
  }
};

const currentError = computed(() => 
  errorContent[errorCode.value] || errorContent['404']
);

const goBack = () => router.back();
const goHome = () => router.push('/');
</script>

<template>
  <div class="error-container">
    <div class="error-card">
      
      <div class="bg-number">{{ errorCode }}</div>

      <div class="content-relative">
        <div class="icon-box">
          <svg v-if="currentError.icon === 'lock'" viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          
          <svg v-if="currentError.icon === 'search'" viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          
          <svg v-if="currentError.icon === 'server'" viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
        </div>

        <h1 class="title">{{ currentError.title }}</h1>
        <p class="message">{{ currentError.message }}</p>

        <div class="actions">
          <button @click="goBack" class="btn btn-secondary">Go Back</button>
          <button @click="goHome" class="btn btn-primary">Return Home</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  padding: 20px;
}

.error-card {
  position: relative;
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  width: 100%;
  text-align: center;
  overflow: hidden;
}

.bg-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -150%) scale(1.5);
  font-size: 8rem;
  font-weight: 800;
  color: #0ea5e9;
  opacity: 0.08;
  z-index: 0;
  pointer-events: none; 
  line-height: 1;
  user-select: none;
}

.content-relative {
  position: relative;
  z-index: 1;
}

.icon-box {
  color: #0ea5e9;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}

.message {
  color: #6b7280;
  margin-bottom: 30px;
  line-height: 1.5;
  font-size: 1rem;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #0ea5e9;
  color: white;
}
.btn-primary:hover {
  background-color: #0284c7;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}
.btn-secondary:hover {
  background-color: #e5e7eb;
}

@media (max-width: 480px) {
  .bg-number {
    font-size: 5rem;
  }
  .actions {
    flex-direction: column;
  }
  .btn {
    width: 100%;
  }
}
</style>
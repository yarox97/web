<script setup>
import { ref } from 'vue'

const showMessage = ref(false)

function toggleMessage() {
  showMessage.value = !showMessage.value
}
</script>

<template>
  <div class="landing-container">
    <header class="landing-header">
      <h1>Welcome to Our Amazing App</h1>
      <p>Your journey starts here. Explore and enjoy!</p>
      <button @click="toggleMessage">Learn More</button>
    </header>

    <section v-if="showMessage" class="landing-info">
      <h2>Why Choose Us?</h2>
      <p>We provide the best solutions for your needs. Fast, reliable, and modern!</p>
    </section>

    <footer class="landing-footer">
      <p>© 2025 My Vue App. All rights reserved.</p>
    </footer>
  </div>
</template>

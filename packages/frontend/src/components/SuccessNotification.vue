<script setup>
import { onMounted } from 'vue'

defineProps({
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

onMounted(() => {
  setTimeout(() => emit('close'), 3000)
})
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 animate-slide-up">
    <div class="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3">
      <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      <p class="font-medium">{{ message }}</p>
      <button @click="$emit('close')" class="ml-4 text-green-200 hover:text-white">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
</style>
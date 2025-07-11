<script setup>
defineProps({ message: String });
defineEmits(['close']);
</script>

<template>
  <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
    <strong class="font-bold">Erreur :</strong>
    <span class="block sm:inline ml-2">{{ message }}</span>
    <button @click="$emit('close')" class="absolute top-0 bottom-0 right-0 px-4 py-3">
      <span class="text-2xl font-bold">&times;</span>
    </button>
  </div>
</template>
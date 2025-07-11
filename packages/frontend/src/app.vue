<script setup>
import { ref, computed } from 'vue';
import { useDark, useToggle, useClipboard } from '@vueuse/core';
import { useVideoStore } from './stores/videoStore';
import VideoResults from './components/VideoResults.vue';
import LoadingSpinner from './components/LoadingSpinner.vue';
import ErrorAlert from './components/ErrorAlert.vue';

const videoStore = useVideoStore();
const url = ref('');
const isDark = useDark();
const toggleDark = useToggle(isDark);
const { copy } = useClipboard();

const videoData = computed(() => videoStore.videoData);
const isLoading = computed(() => videoStore.isLoading);
const error = computed(() => videoStore.error);

const handleSubmit = () => {
  if (!url.value.trim() || isLoading.value) return;
  videoStore.fetchVideoInfo(url.value);
};

const pasteFromClipboard = async () => {
  try {
    url.value = await navigator.clipboard.readText();
  } catch (err) {
    console.error('Failed to read clipboard');
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col transition-colors duration-300">
    <header class="py-4">
      <div class="container mx-auto px-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">sssdwnld</h1>
        <button @click="toggleDark()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <span v-if="isDark">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8 max-w-2xl">
      <div class="text-center mb-8">
        <h2 class="text-4xl font-extrabold text-gray-900 dark:text-white">Téléchargez des Vidéos Simplement</h2>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">Collez un lien, obtenez votre vidéo.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="relative">
        <input
          v-model="url"
          type="url"
          placeholder="https://..."
          required
          :disabled="isLoading"
          class="w-full pl-12 pr-32 py-4 text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-800 transition-all"
        />
        <button type="button" @click="pasteFromClipboard" title="Paste" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          📋
        </button>
        <button type="submit" :disabled="isLoading || !url" class="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <LoadingSpinner v-if="isLoading" />
          <span v-else>Go</span>
        </button>
      </form>

      <ErrorAlert v-if="error" :message="error" @close="videoStore.clearError()" class="mt-8" />

      <VideoResults v-if="videoData" :data="videoData" class="mt-8" />
    </main>

    <footer class="py-6 text-center text-gray-500 dark:text-gray-400">
      <p>Fait avec ❤️ par LASCAMPIA</p>
    </footer>
  </div>
</template>
<script setup>
defineProps({
  data: {
    type: Object,
    required: true
  }
});

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'N/A';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB', 'GB'][i]}`;
};
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col md:flex-row gap-4">
      <img :src="data.metadata.thumbnail" :alt="data.metadata.title" class="w-full md:w-48 h-auto rounded-md object-cover">
      <div class="flex-1">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ data.metadata.title }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ data.metadata.uploader }} • {{ data.metadata.duration_formatted }}</p>
      </div>
    </div>

    <div v-if="data.formats.video.length" class="space-y-2">
      <h4 class="font-semibold">Vidéo</h4>
      <a v-for="format in data.formats.video" :key="format.format_id" :href="format.url" target="_blank" rel="noopener noreferrer" download class="block p-3 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        {{ format.quality }} ({{ format.ext }}) - {{ formatFileSize(format.filesize) }}
      </a>
    </div>

    <div v-if="data.formats.audio.length" class="space-y-2">
      <h4 class="font-semibold">Audio</h4>
       <a v-for="format in data.formats.audio" :key="format.format_id" :href="format.url" target="_blank" rel="noopener noreferrer" download class="block p-3 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        {{ format.quality }} ({{ format.ext }}) - {{ formatFileSize(format.filesize) }}
      </a>
    </div>
  </div>
</template>
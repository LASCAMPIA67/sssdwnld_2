<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useVideoStore } from './stores/videoStore'
import { useHistoryStore } from './stores/historyStore'

import VideoResults from './components/VideoResults.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import ErrorAlert from './components/ErrorAlert.vue'
import SuccessNotification from './components/SuccessNotification.vue'

// Stores
const videoStore = useVideoStore()
const historyStore = useHistoryStore()

// Dark mode
const isDark = useDark()
const toggleDark = useToggle(isDark)

// State
const url = ref('')
const showSuccess = ref(false)
const successMessage = ref('')

const isLoading = computed(() => videoStore.loading)
const error = computed({
  get: () => videoStore.error,
  set: (val) => videoStore.clearError()
})
const videoData = computed(() => videoStore.videoData)

// Handlers
const handleSubmit = async () => {
  if (!url.value.trim()) return
  await videoStore.fetchVideoInfo(url.value)
}

const handleDownloadSuccess = (msg) => {
  successMessage.value = msg
  showSuccess.value = true
}

const loadFromHistory = (item) => {
  url.value = item.url
  handleSubmit()
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) url.value = text
  } catch (err) {
    console.error('Erreur clipboard:', err)
  }
}

// Keyboard shortcuts
onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      const activeEl = document.activeElement
      if (!activeEl || activeEl.tagName !== 'INPUT') {
        pasteFromClipboard()
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      document.querySelector('#url-input')?.focus()
    }
  })
})
</script>

<template>
  <div class="min-h-screen flex flex-col transition-colors duration-300"
       :class="isDark ? 'dark bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'">
    
    <header class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"/>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                sssdwnld
              </h1>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button @click="toggleDark()" 
                    aria-label="Changer le thème"
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg v-if="isDark" class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>
              <svg v-else class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8 max-w-6xl">
      <div class="text-center mb-12 animate-fade-in">
        <h2 class="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Téléchargez vos vidéos préférées
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Collez l'URL d'une vidéo (YouTube, TikTok, Twitter...) pour commencer.
        </p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <label for="url-input" class="sr-only">URL de la vidéo</label>
          <div class="relative">
            <input
              id="url-input"
              v-model="url"
              type="url"
              placeholder="https://..."
              required
              class="w-full px-5 py-4 pr-36 text-base md:text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white transition-all duration-200"
              :disabled="isLoading"
              aria-label="URL de la vidéo"
            />
            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <button
                type="button"
                @click="pasteFromClipboard"
                class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Coller (Ctrl+V)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              </button>
              <button
                type="submit"
                class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                :disabled="isLoading || !url">
                <span v-if="isLoading" class="flex items-center">
                  <LoadingSpinner class="mr-2"/>
                  Analyse...
                </span>
                <span v-else>Analyser</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <ErrorAlert v-if="error" :message="error" @close="error = ''" />
      <VideoResults v-if="videoData" @download-success="handleDownloadSuccess" />

      <div v-if="historyStore.history.length > 0 && !isLoading && !videoData" class="mt-12 animate-fade-in">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800 dark:text-white">Historique</h3>
          <button @click="historyStore.clearHistory" class="text-sm text-gray-500 hover:text-red-600 dark:hover:text-red-400">
            Vider l'historique
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="item in historyStore.history" :key="item.id" @click="loadFromHistory(item)" class="bg-white dark:bg-gray-800 rounded-lg p-3 shadow hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-200 dark:border-gray-700">
            <div class="flex items-center space-x-3">
              <img v-if="item.thumbnail" :src="item.thumbnail" :alt="item.title" class="w-16 h-16 object-cover rounded-md flex-shrink-0">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{{ item.title }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ item.url }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
      <div class="container mx-auto px-4 text-center">
        <p class="text-gray-600 dark:text-gray-400">
          Créé par 
          <a href="https://github.com/LASCAMPIA67" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">
            LASCAMPIA
          </a>
        </p>
      </div>
    </footer>
    
    <SuccessNotification v-if="showSuccess" :message="successMessage" @close="showSuccess = false" />
  </div>
</template>

<style>
/* ... (styles can remain similar) ... */
</style>
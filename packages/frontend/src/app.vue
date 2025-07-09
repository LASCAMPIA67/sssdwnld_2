<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage, useDark, useToggle } from '@vueuse/core'
import axios from 'axios'
import VideoResults from './components/VideoResults.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import ErrorAlert from './components/ErrorAlert.vue'
import SuccessNotification from './components/SuccessNotification.vue'

// Dark mode
const isDark = useDark()
const toggleDark = useToggle(isDark)

// État réactif
const url = ref('')
const loading = ref(false)
const error = ref('')
const videoData = ref(null)
const downloadHistory = useLocalStorage('download-history', [])
const showSuccess = ref(false)
const successMessage = ref('')

// Configuration API
const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : `${window.location.origin}/api/v1`

// Analytics simple
const trackEvent = (eventName, eventData = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventData);
  }
}

// Gestionnaire de soumission
const handleSubmit = async () => {
  if (!url.value.trim()) return

  loading.value = true
  error.value = ''
  videoData.value = null

  try {
    trackEvent('video_analysis_start', { url: url.value })
    
    const response = await axios.post(`${API_BASE_URL}/download`, {
      url: url.value.trim()
    }, {
      timeout: 30000 // 30 secondes timeout
    })

    if (response.data.success) {
      videoData.value = response.data
      
      // Ajouter à l'historique
      downloadHistory.value.unshift({
        id: Date.now(),
        url: url.value,
        title: response.data.metadata.title,
        thumbnail: response.data.metadata.thumbnail,
        timestamp: new Date().toISOString()
      })
      
      // Limiter l'historique à 10 éléments
      if (downloadHistory.value.length > 10) {
        downloadHistory.value = downloadHistory.value.slice(0, 10)
      }
      
      trackEvent('video_analysis_success', { 
        platform: new URL(url.value).hostname 
      })
    }
  } catch (err) {
    console.error('Erreur:', err)
    
    if (err.code === 'ECONNABORTED') {
      error.value = 'La requête a pris trop de temps. Veuillez réessayer.'
    } else if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Une erreur inattendue est survenue. Veuillez réessayer.'
    }
    
    trackEvent('video_analysis_error', { 
      error: error.value 
    })
  } finally {
    loading.value = false
  }
}

// Clear history
const clearHistory = () => {
  downloadHistory.value = []
  showSuccess.value = true
  successMessage.value = 'Historique effacé avec succès'
  setTimeout(() => showSuccess.value = false, 3000)
}

// Load from history
const loadFromHistory = (item) => {
  url.value = item.url
  handleSubmit()
}

// Paste from clipboard
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    url.value = text
  } catch (err) {
    console.error('Erreur clipboard:', err)
  }
}

// Keyboard shortcuts
onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.target.matches('input')) {
      pasteFromClipboard()
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
    
    <!-- Header amélioré -->
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
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Téléchargeur vidéo ultra-rapide
              </p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Bouton historique -->
            <button v-if="downloadHistory.length > 0"
                    @click="clearHistory"
                    class="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              Effacer l'historique
            </button>
            
            <!-- Toggle dark mode -->
            <button @click="toggleDark()" 
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg v-if="isDark" class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
              </svg>
              <svg v-else class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto px-4 py-8 max-w-6xl">
      <!-- Hero Section améliorée -->
      <div class="text-center mb-12 animate-fade-in">
        <h2 class="text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Téléchargez vos vidéos préférées
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            instantanément
          </span>
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Compatible avec YouTube, TikTok, Twitter/X, Instagram et plus de 100 plateformes.
          Rapide, sécurisé et sans inscription.
        </p>
      </div>

      <!-- Formulaire amélioré -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="url-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Collez l'URL de la vidéo
            </label>
            <div class="relative">
              <input
                id="url-input"
                v-model="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                required
                class="w-full px-4 py-4 pr-32 text-lg rounded-xl border-2 border-gray-300 dark:border-gray-600 
                       focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20
                       dark:bg-gray-700 dark:text-white transition-all duration-200"
                :disabled="loading"
              />
              
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <!-- Bouton coller -->
                <button
                  type="button"
                  @click="pasteFromClipboard"
                  class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Coller (Ctrl+V)">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </button>
                
                <!-- Bouton analyser -->
                <button
                  type="submit"
                  class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg
                         hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                         transform hover:scale-105 active:scale-95"
                  :disabled="loading || !url">
                  <span v-if="loading" class="flex items-center space-x-2">
                    <LoadingSpinner />
                    <span>Analyse...</span>
                  </span>
                  <span v-else class="flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <span>Analyser</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Plateformes supportées avec icônes -->
          <div class="flex flex-wrap items-center justify-center gap-4 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Supporté :</span>
            <div class="flex flex-wrap gap-3">
              <span class="platform-badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </span>
              <span class="platform-badge bg-black text-white dark:bg-gray-800">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                TikTok
              </span>
              <span class="platform-badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter/X
              </span>
              <span class="platform-badge bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Instagram
              </span>
              <span class="platform-badge bg-blue-600 text-white">
                Facebook
              </span>
              <span class="text-gray-500 dark:text-gray-400">+100 autres</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Affichage de l'erreur -->
      <ErrorAlert v-if="error" :message="error" @close="error = ''" />

      <!-- Résultats de la vidéo -->
      <VideoResults v-if="videoData" :data="videoData" @download-success="(msg) => { showSuccess = true; successMessage = msg }" />

      <!-- Historique des téléchargements -->
      <div v-if="downloadHistory.length > 0 && !loading && !videoData" 
           class="mt-12 animate-fade-in">
        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Historique récent
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="item in downloadHistory" 
               :key="item.id"
               @click="loadFromHistory(item)"
               class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg 
                      transition-all duration-200 cursor-pointer group border border-gray-200 dark:border-gray-700">
            <div class="flex items-start space-x-3">
              <img v-if="item.thumbnail" 
                   :src="item.thumbnail" 
                   :alt="item.title"
                   class="w-20 h-20 object-cover rounded-lg">
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {{ item.title }}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {{ new URL(item.url).hostname }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ new Date(item.timestamp).toLocaleDateString() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer amélioré -->
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <p class="text-gray-600 dark:text-gray-400">
            Créé avec ❤️ par 
            <a href="https://github.com/LASCAMPIA67" 
               target="_blank" 
               class="text-blue-600 dark:text-blue-400 hover:underline">
              LASCAMPIA
            </a>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
            © 2024 sssdwnld. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
    <!-- Notification de succès -->
        <SuccessNotification v-if="showSuccess" :message="successMessage" @close="showSuccess = false" />
      </div>
    </template>

    <style>
    /* Animations personnalisées */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }

    /* Badge des plateformes */
    .platform-badge {
      @apply inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium;
    }

    /* Amélioration du dark mode */
    .dark {
      color-scheme: dark;
    }

    /* Scrollbar personnalisée dark mode */
    .dark ::-webkit-scrollbar {
      @apply bg-gray-800;
    }

    .dark ::-webkit-scrollbar-thumb {
      @apply bg-gray-600;
    }

    .dark ::-webkit-scrollbar-thumb:hover {
      @apply bg-gray-500;
    }
    </style>
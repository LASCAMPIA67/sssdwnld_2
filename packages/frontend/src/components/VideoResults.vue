<script setup>
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['download-success'])

const { copy, copied } = useClipboard()
const selectedFormat = ref(null)
const downloading = ref(false)

// Formatage des fonctions
const formatDuration = (seconds) => {
  if (!seconds) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatViews = (views) => {
  if (!views) return '0 vues'
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M vues`
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K vues`
  }
  return `${views.toLocaleString()} vues`
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Taille inconnue'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Date inconnue'
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  return new Date(`${year}-${month}-${day}`).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Sélection du meilleur format par défaut
const bestVideoFormat = computed(() => {
  if (!props.data?.formats?.video?.length) return null
  return props.data.formats.video[0]
})

// Download handler
const downloadFormat = async (format, type) => {
  if (!format.url) {
    emit('download-success', 'URL de téléchargement non disponible')
    return
  }

  downloading.value = true
  selectedFormat.value = format.format_id

  try {
    // Simuler le téléchargement (ici vous pouvez ajouter une vraie logique)
    window.open(format.url, '_blank')
    
    emit('download-success', `Téléchargement de ${props.data.metadata.title} démarré`)
    
    // Track download
    if (window.gtag) {
      window.gtag('event', 'download', {
        video_title: props.data.metadata.title,
        format: format.quality,
        type: type
      })
    }
  } catch (error) {
    console.error('Erreur téléchargement:', error)
    emit('download-success', 'Erreur lors du téléchargement')
  } finally {
    setTimeout(() => {
      downloading.value = false
      selectedFormat.value = null
    }, 2000)
  }
}

// Copier le lien
const copyLink = () => {
  copy(props.data.metadata.webpage_url)
  emit('download-success', 'Lien copié dans le presse-papier!')
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Métadonnées de la vidéo -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="md:flex">
        <!-- Thumbnail -->
        <div class="md:w-1/3">
          <img 
            :src="data.metadata.thumbnail" 
            :alt="data.metadata.title"
            class="w-full h-full object-cover"
          />
        </div>
        
        <!-- Infos -->
        <div class="md:w-2/3 p-6">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ data.metadata.title }}
          </h3>
          
          <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span class="flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>{{ data.metadata.uploader }}</span>
            </span>
            
            <span class="flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{{ formatDuration(data.metadata.duration) }}</span>
            </span>
            
            <span class="flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <span>{{ formatViews(data.metadata.view_count) }}</span>
            </span>
          </div>
          
          <p v-if="data.metadata.description" class="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
            {{ data.metadata.description }}
          </p>
          
          <div class="flex items-center space-x-3">
            <button
              @click="copyLink"
              class="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 
                     text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 
                     dark:hover:bg-gray-600 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
              </svg>
              <span>{{ copied ? 'Copié!' : 'Copier le lien' }}</span>
            </button>
            
            <span v-if="data.metadata.upload_date" class="text-sm text-gray-500 dark:text-gray-400">
              Publié le {{ formatDate(data.metadata.upload_date) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Formats vidéo -->
    <div v-if="data.formats.video.length" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span>Formats vidéo disponibles</span>
      </h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="format in data.formats.video" 
             :key="format.format_id"
             class="relative group">
          <button
            @click="downloadFormat(format, 'video')"
            :disabled="downloading"
            class="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 
                   dark:hover:bg-gray-600 transition-all duration-200 text-left
                   border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400
                   disabled:opacity-50 disabled:cursor-not-allowed">
            
            <!-- Badge qualité -->
            <div class="flex items-center justify-between mb-2">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                           bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {{ format.quality }}
              </span>
              
              <span v-if="format === bestVideoFormat" 
                    class="text-xs text-green-600 dark:text-green-400 font-medium">
                Recommandé
              </span>
            </div>
            
            <!-- Détails -->
            <div class="space-y-1 text-sm">
              <div class="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Format:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ format.ext.toUpperCase() }}</span>
              </div>
              
              <div class="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Résolution:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ format.resolution }}</span>
              </div>
              
              <div v-if="format.fps" class="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>FPS:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ format.fps }}</span>
              </div>
              
              <div v-if="format.filesize" class="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Taille:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ formatFileSize(format.filesize) }}</span>
              </div>
            </div>
            
            <!-- Icône de téléchargement -->
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg v-if="downloading && selectedFormat === format.format_id" 
                   class="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <svg v-else class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Formats audio -->
    <div v-if="data.formats.audio.length" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <span>Formats audio uniquement</span>
      </h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="format in data.formats.audio" 
             :key="format.format_id"
             class="relative group">
          <button
            @click="downloadFormat(format, 'audio')"
            :disabled="downloading"
            class="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 
                   dark:hover:bg-gray-600 transition-all duration-200 text-left
                   border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-400
                   disabled:opacity-50 disabled:cursor-not-allowed">
            
            <!-- Badge qualité -->
            <div class="flex items-center justify-between mb-2">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                           bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                {{ format.quality }}
              </span>
            </div>
            
            <!-- Détails -->
            <div class="space-y-1 text-sm">
              <div class="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Format:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ format.ext.toUpperCase() }}</span>
              </div>
              
              <div class="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Codec:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ format.acodec }}</span>
              </div>
              
              <div v-if="format.filesize" class="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Taille:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ formatFileSize(format.filesize) }}</span>
              </div>
            </div>
            
            <!-- Icône de téléchargement -->
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg v-if="downloading && selectedFormat === format.format_id" 
                   class="w-5 h-5 text-purple-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <svg v-else class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
// packages/frontend/src/stores/videoStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { useHistoryStore } from './historyStore'

export const useVideoStore = defineStore('video', () => {
  // État
  const videoData = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const downloadProgress = ref({})

  // Actions
  const fetchVideoInfo = async (url) => {
    loading.value = true
    error.value = null
    videoData.value = null

    try {
      const response = await api.fetchVideoInfo(url)
      
      if (response.success) {
        videoData.value = response
        
        // Ajouter à l'historique
        const historyStore = useHistoryStore()
        historyStore.addToHistory({
          url,
          title: response.metadata.title,
          thumbnail: response.metadata.thumbnail,
          duration: response.metadata.duration,
          platform: extractPlatform(url)
        })
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des infos:', err)
      error.value = err.response?.data?.message || 'Une erreur est survenue lors de la récupération des informations.'
    } finally {
      loading.value = false
    }
  }

  const downloadVideo = async (format, type = 'video') => {
    if (!format.url) {
      throw new Error('URL de téléchargement non disponible')
    }

    try {
      // Tracker le téléchargement
      downloadProgress.value[format.format_id] = {
        status: 'downloading',
        progress: 0
      }

      // Pour une vraie implémentation, vous pourriez utiliser fetch avec ReadableStream
      // pour suivre la progression du téléchargement
      const response = await fetch(format.url)
      const blob = await response.blob()
      
      // Créer un lien de téléchargement
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${videoData.value.metadata.title}.${format.ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      downloadProgress.value[format.format_id] = {
        status: 'completed',
        progress: 100
      }

      return true
    } catch (err) {
      downloadProgress.value[format.format_id] = {
        status: 'error',
        progress: 0
      }
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearVideoData = () => {
    videoData.value = null
    error.value = null
    downloadProgress.value = {}
  }

  // Helpers
  const extractPlatform = (url) => {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube'
      if (hostname.includes('tiktok.com')) return 'TikTok'
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter/X'
      if (hostname.includes('instagram.com')) return 'Instagram'
      if (hostname.includes('facebook.com') || hostname.includes('fb.')) return 'Facebook'
      if (hostname.includes('vimeo.com')) return 'Vimeo'
      if (hostname.includes('dailymotion.com')) return 'Dailymotion'
      
      return urlObj.hostname
    } catch {
      return 'Plateforme inconnue'
    }
  }

  return {
    // État
    videoData,
    loading,
    error,
    downloadProgress,
    
    // Actions
    fetchVideoInfo,
    downloadVideo,
    clearError,
    clearVideoData
  }
})
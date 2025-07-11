// packages/frontend/src/services/api.js
import axios from 'axios'

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
const TIMEOUT = 30000 // 30 secondes

// Créer une instance axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// Intercepteur de requête
apiClient.interceptors.request.use(
  (config) => {
    // Ajouter un token si nécessaire
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur de réponse
apiClient.interceptors.response.use(
  (response) => {
    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`✅ Response from ${response.config.url}:`, response.data)
    }
    return response
  },
  (error) => {
    // Gestion globale des erreurs
    if (error.response) {
      // Erreur de réponse du serveur
      const { status, data } = error.response

      switch (status) {
        case 400:
          console.error('❌ Requête invalide:', data.message)
          break
        case 401:
          console.error('❌ Non authentifié')
          // Rediriger vers login si nécessaire
          break
        case 403:
          console.error('❌ Accès interdit')
          break
        case 404:
          console.error('❌ Ressource non trouvée')
          break
        case 429:
          console.error('❌ Trop de requêtes')
          break
        case 500:
        case 502:
        case 503:
          console.error('❌ Erreur serveur')
          break
        default:
          console.error(`❌ Erreur ${status}:`, data.message)
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      console.error('❌ Pas de réponse du serveur:', error.message)
    } else {
      // Erreur dans la configuration de la requête
      console.error('❌ Erreur de configuration:', error.message)
    }

    return Promise.reject(error)
  }
)

// API Methods
const api = {
  // Récupérer les informations d'une vidéo
  async fetchVideoInfo(url) {
    try {
      const response = await apiClient.post('/download', { url })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Vérifier la santé de l'API
  async checkHealth() {
    try {
      const response = await apiClient.get('/health')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Télécharger une vidéo avec un format spécifique
  async downloadVideo(videoUrl, formatId) {
    try {
      const response = await apiClient.post('/download/direct', {
        url: videoUrl,
        format_id: formatId
      }, {
        responseType: 'blob',
        timeout: 120000, // 2 minutes pour les téléchargements
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          // Émettre un événement pour suivre la progression
          window.dispatchEvent(new CustomEvent('download-progress', {
            detail: { formatId, progress: percentCompleted }
          }))
        }
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Récupérer les statistiques d'utilisation
  async getStats() {
    try {
      const response = await apiClient.get('/stats')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Signaler un problème
  async reportIssue(data) {
    try {
      const response = await apiClient.post('/report', data)
      return response.data
    } catch (error) {
      throw error
    }
  }
}

// Exporter l'instance axios pour des cas d'usage avancés
export { apiClient }

// Exporter l'API par défaut
export default api
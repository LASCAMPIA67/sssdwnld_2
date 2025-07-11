// packages/frontend/src/stores/historyStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const HISTORY_KEY = 'sssdwnld_history'
const MAX_HISTORY_ITEMS = 50

export const useHistoryStore = defineStore('history', () => {
  // État
  const history = ref([])

  // Charger l'historique depuis localStorage au démarrage
  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Valider et nettoyer les données
        history.value = parsed
          .filter(item => item && item.url && item.title)
          .slice(0, MAX_HISTORY_ITEMS)
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err)
      history.value = []
    }
  }

  // Sauvegarder l'historique dans localStorage
  const saveHistory = () => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', err)
    }
  }

  // Actions
  const addToHistory = (item) => {
    // Vérifier les données requises
    if (!item.url || !item.title) return

    // Créer l'entrée d'historique
    const historyItem = {
      id: Date.now().toString(),
      url: item.url,
      title: item.title.substring(0, 100), // Limiter la longueur
      thumbnail: item.thumbnail || null,
      duration: item.duration || null,
      platform: item.platform || 'Inconnu',
      timestamp: new Date().toISOString()
    }

    // Supprimer les doublons (même URL)
    history.value = history.value.filter(h => h.url !== item.url)

    // Ajouter au début
    history.value.unshift(historyItem)

    // Limiter la taille de l'historique
    if (history.value.length > MAX_HISTORY_ITEMS) {
      history.value = history.value.slice(0, MAX_HISTORY_ITEMS)
    }

    // Sauvegarder
    saveHistory()
  }

  const removeFromHistory = (id) => {
    history.value = history.value.filter(item => item.id !== id)
    saveHistory()
  }

  const clearHistory = () => {
    history.value = []
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'historique:', err)
    }
  }

  // Computed
  const recentHistory = computed(() => {
    return history.value.slice(0, 10)
  })

  const historyByPlatform = computed(() => {
    const grouped = {}
    history.value.forEach(item => {
      if (!grouped[item.platform]) {
        grouped[item.platform] = []
      }
      grouped[item.platform].push(item)
    })
    return grouped
  })

  const searchHistory = (query) => {
    const searchTerm = query.toLowerCase()
    return history.value.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.url.toLowerCase().includes(searchTerm) ||
      item.platform.toLowerCase().includes(searchTerm)
    )
  }

  // Charger l'historique au démarrage
  loadHistory()

  return {
    // État
    history,
    
    // Computed
    recentHistory,
    historyByPlatform,
    
    // Actions
    addToHistory,
    removeFromHistory,
    clearHistory,
    searchHistory
  }
})
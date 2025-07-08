<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-primary-600">
            sssdwnld_2
          </h1>
          <span class="text-sm text-gray-500">
            Téléchargeur Multi-Plateformes
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      <!-- Hero Section -->
      <div class="text-center mb-10">
        <h2 class="text-4xl font-bold text-gray-800 mb-4">
          Téléchargez vos vidéos préférées
        </h2>
        <p class="text-lg text-gray-600">
          Compatible avec YouTube, TikTok, Twitter, Instagram et plus de 100 plateformes
        </p>
      </div>

      <!-- Input Form -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="url" class="block text-sm font-medium text-gray-700 mb-2">
              Collez l'URL de la vidéo
            </label>
            <div class="flex space-x-3">
              <input
                id="url"
                v-model="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                required
                class="input-field flex-1"
                :disabled="loading"
              />
              <button
                type="submit"
                class="btn-primary flex items-center space-x-2"
                :disabled="loading || !url"
              >
                <span v-if="loading" class="loader"></span>
                <span v-else>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                  </svg>
                </span>
                <span>{{ loading ? 'Analyse...' : 'Analyser' }}</span>
              </button>
            </div>
          </div>

          <!-- Supported Platforms -->
          <div class="flex flex-wrap gap-2 text-xs text-gray-500">
            <span class="bg-gray-100 px-2 py-1 rounded">YouTube</span>
            <span class="bg-gray-100 px-2 py-1 rounded">TikTok</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Twitter/X</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Instagram</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Facebook</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Et 100+ autres...</span>
          </div>
        </form>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 fade-in">
        <div class="flex items-start">
          <svg class="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <p class="font-medium">Erreur</p>
            <p class="text-sm
                      <script setup>
import { ref } from 'vue'
import axios from 'axios'

// État réactif
const url = ref('')
const loading = ref(false)
const error = ref('')
const videoData = ref(null)

// Configuration de l'API
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/v1' 
  : `${window.location.origin}/api/v1`

// Fonctions utilitaires
const formatDuration = (seconds) => {
  if (!seconds) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

const formatViews = (views) => {
  if (!views) return '0'
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toLocaleString()
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Taille inconnue'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// Gestionnaire de soumission
const handleSubmit = async () => {
  if (!url.value.trim()) return
  
  loading.value = true
  error.value = ''
  videoData.value = null
  
  try {
    const response = await axios.post(`${API_BASE_URL}/download`, {
      url: url.value.trim()
    })
    
    if (response.data.success) {
      videoData.value = response.data
    } else {
      throw new Error(response.data.message || 'Une erreur est survenue')
    }
  } catch (err) {
    console.error('Erreur:', err)
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Une erreur inattendue est survenue. Veuillez réessayer.'
    }
  } finally {
    loading.value = false
  }
}

// Fonction de téléchargement
const downloadFormat = (format) => {
  if (!format.url) {
    error.value = 'URL de téléchargement non disponible'
    return
  }
  
  // Ouvrir le lien de téléchargement dans un nouvel onglet
  window.open(format.url, '_blank')
}
</script><template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-primary-600">
            sssdwnld_2
          </h1>
          <span class="text-sm text-gray-500">
            Téléchargeur Multi-Plateformes
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      <!-- Hero Section -->
      <div class="text-center mb-10">
        <h2 class="text-4xl font-bold text-gray-800 mb-4">
          Téléchargez vos vidéos préférées
        </h2>
        <p class="text-lg text-gray-600">
          Compatible avec YouTube, TikTok, Twitter, Instagram et plus de 100 plateformes
        </p>
      </div>

      <!-- Input Form -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="url" class="block text-sm font-medium text-gray-700 mb-2">
              Collez l'URL de la vidéo
            </label>
            <div class="flex space-x-3">
              <input
                id="url"
                v-model="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                required
                class="input-field flex-1"
                :disabled="loading"
              />
              <button
                type="submit"
                class="btn-primary flex items-center space-x-2"
                :disabled="loading || !url"
              >
                <span v-if="loading" class="loader"></span>
                <span v-else>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                  </svg>
                </span>
                <span>{{ loading ? 'Analyse...' : 'Analyser' }}</span>
              </button>
            </div>
          </div>

          <!-- Supported Platforms -->
          <div class="flex flex-wrap gap-2 text-xs text-gray-500">
            <span class="bg-gray-100 px-2 py-1 rounded">YouTube</span>
            <span class="bg-gray-100 px-2 py-1 rounded">TikTok</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Twitter/X</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Instagram</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Facebook</span>
            <span class="bg-gray-100 px-2 py-1 rounded">Et 100+ autres...</span>
          </div>
        </form>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 fade-in">
        <div class="flex items-start">
          <svg class="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <p class="font-medium">Erreur</p>
            <p class="text-sm">{{ error }}</p>
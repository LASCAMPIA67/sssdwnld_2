import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useVideoStore = defineStore('video', () => {
  const videoData = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  async function fetchVideoInfo(url) {
    isLoading.value = true;
    error.value = null;
    videoData.value = null;

    try {
      const response = await axios.post('/api/v1/download', { url });
      if (response.data.success) {
        videoData.value = response.data;
      } else {
        throw new Error(response.data.message || 'Server responded with an error.');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'An unknown error occurred.';
    } finally {
      isLoading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }
  
  return {
    videoData,
    isLoading,
    error,
    fetchVideoInfo,
    clearError,
  };
});
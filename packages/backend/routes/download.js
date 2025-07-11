// packages/backend/routes/download.js

const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const { validators, handleValidationErrors } = require('../middleware/validation');
const cache = require('../middleware/cache');
const logger = require('../config/logger');

/**
 * POST /api/v1/download
 * Récupère les métadonnées et formats d'une vidéo
 */
router.post('/', 
  validators.videoUrl,
  handleValidationErrors,
  cache.checkCache,
  async (req, res, next) => {
    const { url } = req.body;

    try {
      // Logger la requête
      logger.info('Nouvelle requête de téléchargement', { 
        url, 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Récupérer les informations
      const videoData = await videoService.getVideoInfo(url);

      // Mettre en cache (30 minutes)
      if (req.cache && videoData.success) {
        await req.cache.set(url, videoData, 1800);
      }

      // Analytics
      logger.info('Vidéo analysée avec succès', {
        url,
        platform: videoData.metadata.platform || 'unknown',
        duration: videoData.metadata.duration,
        formats: {
          video: videoData.formats.video.length,
          audio: videoData.formats.audio.length
        }
      });

      res.json(videoData);
    } catch (error) {
      next(error);
    }
});

/**
 * POST /api/v1/download/direct
 * Télécharge directement une vidéo avec un format spécifique
 */
router.post('/direct',
  validators.videoUrl,
  validators.formatId,
  handleValidationErrors,
  async (req, res, next) => {
    const { url, format_id } = req.body;

    try {
      logger.info('Téléchargement direct demandé', { url, format_id });

      // Obtenir l'URL de téléchargement
      const downloadUrl = await videoService.getDirectDownloadUrl(url, format_id);

      // Rediriger vers l'URL de téléchargement
      res.json({
        success: true,
        download_url: downloadUrl,
        expires_in: 3600 // 1 heure
      });

    } catch (error) {
      next(error);
    }
});

/**
 * GET /api/v1/download/supported
 * Liste des plateformes supportées
 */
router.get('/supported', cache.cacheMiddleware(3600), (req, res) => {
  const platforms = [
    {
      name: 'YouTube',
      domains: ['youtube.com', 'youtu.be'],
      features: ['video', 'audio', 'playlists']
    },
    {
      name: 'TikTok',
      domains: ['tiktok.com'],
      features: ['video']
    },
    {
      name: 'Twitter/X',
      domains: ['twitter.com', 'x.com'],
      features: ['video']
    },
    {
      name: 'Instagram',
      domains: ['instagram.com'],
      features: ['video', 'reels', 'stories']
    },
    {
      name: 'Facebook',
      domains: ['facebook.com', 'fb.watch'],
      features: ['video']
    },
    {
      name: 'Vimeo',
      domains: ['vimeo.com'],
      features: ['video']
    },
    {
      name: 'Dailymotion',
      domains: ['dailymotion.com'],
      features: ['video']
    },
    {
      name: 'Reddit',
      domains: ['reddit.com'],
      features: ['video']
    },
    {
      name: 'Twitch',
      domains: ['twitch.tv'],
      features: ['clips', 'vods']
    }
  ];

  res.json({
    success: true,
    platforms,
    total: platforms.length,
    note: 'Plus de 100 autres plateformes sont également supportées'
  });
});

module.exports = router;
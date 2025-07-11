const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const { validators, handleValidationErrors } = require('../middleware/validation');
const { checkCache, setCache } = require('../middleware/cache');
const logger = require('../config/logger');

router.post('/', 
  validators.videoUrl,
  handleValidationErrors,
  checkCache,
  async (req, res, next) => {
    const { url } = req.body;
    try {
      logger.info('Processing request for URL', { url, ip: req.ip });
      const videoData = await videoService.getVideoInfo(url);
      if (videoData.success) {
        setCache(req.originalUrl, videoData, 1800);
      }
      res.json(videoData);
    } catch (error) {
      next(error);
    }
});

module.exports = router;
// packages/backend/routes/download.js

const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');

/**
 * @swagger
 * /api/v1/download:
 * post:
 * summary: Récupère les métadonnées et les formats d'une vidéo depuis une URL.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * url:
 * type: string
 * example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 * responses:
 * 200:
 * description: Succès - retourne les informations de la vidéo.
 * 400:
 * description: URL manquante ou invalide.
 * 500:
 * description: Erreur serveur.
 */
router.post('/', async (req, res, next) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: true,
      message: 'URL manquante ou invalide.',
    });
  }

  try {
    const videoData = await videoService.getVideoInfo(url);
    res.json(videoData);
  } catch (error) {
    // Transfère l'erreur au middleware central
    next(error);
  }
});

module.exports = router;
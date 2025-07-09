// packages/backend/routes/download.js - CRÉER CE FICHIER
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Route principale
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: true,
        message: 'URL manquante'
      });
    }

    console.log(`Traitement de l'URL: ${url}`);

    // Commande yt-dlp sécurisée
    const command = `yt-dlp -j --no-warnings --no-playlist "${url}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    });

    if (stderr && !stderr.includes('WARNING')) {
      console.error('Avertissement yt-dlp:', stderr);
    }

    const info = JSON.parse(stdout);

    // Extraction des formats disponibles
    const formats = info.formats || [];
    
    // Filtrage et organisation des formats
    const videoFormats = formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
      .sort((a, b) => {
        if (a.height !== b.height) return (b.height || 0) - (a.height || 0);
        return (b.tbr || 0) - (a.tbr || 0);
      })
      .slice(0, 5);

    const audioFormats = formats
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a, b) => (b.abr || 0) - (a.abr || 0))
      .slice(0, 3);

    // Construction de la réponse
    const response = {
      success: true,
      metadata: {
        title: info.title || 'Sans titre',
        duration: info.duration || 0,
        thumbnail: info.thumbnail || null,
        description: info.description ? info.description.substring(0, 200) + '...' : null,
        uploader: info.uploader || info.channel || 'Inconnu',
        view_count: info.view_count || 0,
        upload_date: info.upload_date || null,
        webpage_url: info.webpage_url || url
      },
      formats: {
        video: videoFormats.map(f => ({
          format_id: f.format_id,
          quality: f.format_note || `${f.height}p` || 'Qualité inconnue',
          ext: f.ext,
          filesize: f.filesize || f.filesize_approx || null,
          url: f.url,
          resolution: f.resolution || `${f.width}x${f.height}` || 'N/A',
          fps: f.fps || null,
          vcodec: f.vcodec,
          acodec: f.acodec
        })),
        audio: audioFormats.map(f => ({
          format_id: f.format_id,
          quality: `${f.abr || 'N/A'}kbps`,
          ext: f.ext,
          filesize: f.filesize || f.filesize_approx || null,
          url: f.url,
          acodec: f.acodec
        }))
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erreur lors du traitement:', error);
    
    let errorMessage = 'Une erreur est survenue lors du traitement de votre demande';
    let statusCode = 500;

    const errorString = error.message || error.toString();

    if (errorString.includes('Unsupported URL') || errorString.includes('not a valid URL')) {
      errorMessage = 'URL non supportée. Veuillez vérifier que l\'URL est valide.';
      statusCode = 400;
    } else if (errorString.includes('Video unavailable') || errorString.includes('Private video')) {
      errorMessage = 'Vidéo non disponible ou privée.';
      statusCode = 404;
    } else if (errorString.includes('429') || errorString.includes('Too Many Requests')) {
      errorMessage = 'Trop de requêtes. Veuillez réessayer dans quelques instants.';
      statusCode = 429;
    } else if (errorString.includes('yt-dlp') && errorString.includes('not found')) {
      errorMessage = 'Service temporairement indisponible. Veuillez réessayer.';
      statusCode = 503;
    }

    res.status(statusCode).json({ 
      error: true,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
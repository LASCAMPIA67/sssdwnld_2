const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/download.log' })
  ]
});

// Validation schema
const downloadSchema = Joi.object({
  url: Joi.string().uri().required()
});

// Vérifier si yt-dlp est installé
async function checkYtDlp() {
  try {
    await execAsync('which yt-dlp');
    return true;
  } catch (error) {
    return false;
  }
}

// Route principale
router.post('/', async (req, res, next) => {
  try {
    // Validation
    const { error, value } = downloadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message
      });
    }

    const { url } = value;

    // Vérifier yt-dlp
    const hasYtDlp = await checkYtDlp();
    if (!hasYtDlp) {
      return res.status(503).json({
        error: true,
        message: 'Service temporairement indisponible'
      });
    }

    // Log de la requête
    logger.info('Download request', { 
      url, 
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Commande yt-dlp sécurisée
    const command = `yt-dlp -j --no-warnings --no-playlist --socket-timeout 30 "${url}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    });

    const info = JSON.parse(stdout);

    // Filtrage des formats
    const formats = info.formats || [];
    
    const videoFormats = formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.height >= 360)
      .sort((a, b) => {
        if (a.height !== b.height) return (b.height || 0) - (a.height || 0);
        return (b.tbr || 0) - (a.tbr || 0);
      })
      .slice(0, 6);

    const audioFormats = formats
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.abr >= 128)
      .sort((a, b) => (b.abr || 0) - (a.abr || 0))
      .slice(0, 3);

    // Construction de la réponse
    const response = {
      success: true,
      metadata: {
        title: info.title || 'Sans titre',
        duration: info.duration || 0,
        thumbnail: info.thumbnail || null,
        description: info.description ? info.description.substring(0, 300) : null,
        uploader: info.uploader || info.channel || 'Inconnu',
        view_count: info.view_count || 0,
        upload_date: info.upload_date || null,
        webpage_url: info.webpage_url || url,
        like_count: info.like_count || 0,
        dislike_count: info.dislike_count || 0
      },
      formats: {
        video: videoFormats.map(f => ({
          format_id: f.format_id,
          quality: f.format_note || `${f.height}p` || 'HD',
          ext: f.ext,
          filesize: f.filesize || f.filesize_approx || null,
          url: f.url,
          resolution: f.resolution || `${f.width}x${f.height}` || 'N/A',
         fps: f.fps || null,
          vcodec: f.vcodec || null,
          acodec: f.acodec || null,
          tbr: f.tbr || null
        })),
        audio: audioFormats.map(f => ({
                format_id: f.format_id,
                quality: `${f.abr || 'N/A'}kbps`,
                ext: f.ext,
                filesize: f.filesize || f.filesize_approx || null,
                url: f.url,
                acodec: f.acodec,
                abr: f.abr || null
                }))
            }
            };

            // Log du succès
            logger.info('Download success', { 
            url, 
            title: info.title,
            formats: {
                video: videoFormats.length,
                audio: audioFormats.length
            }
            });

            res.json(response);

        } catch (error) {
            logger.error('Download error', { 
            error: error.message,
            url: req.body.url 
            });
            
            next(error);
        }
        });

        // Route pour obtenir les formats disponibles
        router.get('/formats', async (req, res, next) => {
        try {
            const { url } = req.query;

            if (!url) {
            return res.status(400).json({
                error: true,
                message: 'URL manquante'
            });
            }

            const command = `yt-dlp -F --no-warnings "${url}"`;
            const { stdout } = await execAsync(command, {
            timeout: 30000
            });

            res.json({
            success: true,
            formats: stdout
            });

        } catch (error) {
            next(error);
        }
        });

        module.exports = router;
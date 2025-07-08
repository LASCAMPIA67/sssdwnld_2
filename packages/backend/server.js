const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Initialisation de yt-dlp
const ytDlpPath = path.join(__dirname, 'yt-dlp');
const ytDlpWrap = new YTDlpWrap(ytDlpPath);

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || '*'
    : 'http://localhost:5173',
  credentials: true
}));

// Middleware de logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parsing du JSON
app.use(express.json());

// Limitation du taux de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});

app.use('/api/', limiter);

// Fonction pour télécharger et mettre à jour yt-dlp
async function updateYtDlp() {
  try {
    console.log('Vérification et téléchargement de yt-dlp...');
    await ytDlpWrap.downloadFromGithub(ytDlpPath);
    console.log('yt-dlp est prêt !');
  } catch (error) {
    console.error('Erreur lors du téléchargement de yt-dlp:', error);
  }
}

// Mise à jour de yt-dlp au démarrage
updateYtDlp();

// Route de santé
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'sssdwnld_2',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Route principale de téléchargement
app.post('/api/v1/download', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      error: 'URL manquante',
      message: 'Veuillez fournir une URL valide'
    });
  }

  try {
    console.log(`Traitement de l'URL: ${url}`);

    // Options pour yt-dlp
    const options = [
      '-j', // Format JSON pour obtenir les métadonnées
      '--no-warnings',
      '--no-playlist',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      url
    ];

    // Récupération des métadonnées
    const metadata = await ytDlpWrap.execPromise(options);
    const info = JSON.parse(metadata);

    // Extraction des formats disponibles
    const formats = info.formats || [];
    
    // Filtrage et organisation des formats
    const videoFormats = formats
      .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
      .sort((a, b) => {
        // Priorité : qualité (height) puis bitrate
        if (a.height !== b.height) return (b.height || 0) - (a.height || 0);
        return (b.tbr || 0) - (a.tbr || 0);
      })
      .slice(0, 5); // Garder les 5 meilleurs formats

    const audioFormats = formats
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a, b) => (b.abr || 0) - (a.abr || 0))
      .slice(0, 3); // Garder les 3 meilleurs formats audio

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
    
    // Gestion des erreurs spécifiques
    let errorMessage = 'Une erreur est survenue lors du traitement de votre demande';
    let statusCode = 500;

    if (error.message.includes('Unsupported URL')) {
      errorMessage = 'URL non supportée. Veuillez vérifier que l\'URL est valide et provient d\'une plateforme supportée.';
      statusCode = 400;
    } else if (error.message.includes('Video unavailable')) {
      errorMessage = 'Vidéo non disponible ou privée.';
      statusCode = 404;
    } else if (error.message.includes('429')) {
      errorMessage = 'Trop de requêtes. Veuillez réessayer dans quelques instants.';
      statusCode = 429;
    }

    res.status(statusCode).json({ 
      error: true,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour télécharger directement un format
app.get('/api/v1/download/direct', async (req, res) => {
  const { url, format_id } = req.query;

  if (!url || !format_id) {
    return res.status(400).json({ 
      error: 'Paramètres manquants',
      message: 'URL et format_id sont requis'
    });
  }

  try {
    // Redirection vers l'URL directe du format
    // Dans un environnement de production, vous pourriez implémenter
    // un proxy pour masquer l'URL réelle ou ajouter des fonctionnalités
    res.json({
      message: 'Utilisez l\'URL fournie dans les formats pour télécharger directement'
    });
  } catch (error) {
    res.status(500).json({ 
      error: true,
      message: 'Erreur lors de la génération du lien de téléchargement'
    });
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.url} n'existe pas`
  });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: 'Une erreur inattendue s\'est produite'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║       sssdwnld_2 Backend API           ║
║       Créé par LASCAMPIA               ║
╠════════════════════════════════════════╣
║  Serveur démarré sur le port ${PORT}      ║
║  Environnement: ${process.env.NODE_ENV || 'development'}         ║
╚════════════════════════════════════════╝
  `);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt en cours...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt en cours...');
  process.exit(0);
});
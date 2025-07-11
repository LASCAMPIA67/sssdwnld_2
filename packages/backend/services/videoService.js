// packages/backend/services/videoService.js

const YtDlpWrap = require('yt-dlp-wrap');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../config/logger');

// Configuration yt-dlp
const ytDlpBinary = path.join(__dirname, '..', 'bin', 'yt-dlp');
const ytDlpWrap = new YtDlpWrap(ytDlpBinary);

// Vérifier et télécharger yt-dlp si nécessaire
const ensureYtDlpExists = async () => {
  try {
    await fs.access(ytDlpBinary);
    logger.info('yt-dlp binaire trouvé');
  } catch {
    logger.info('Téléchargement de yt-dlp...');
    await fs.mkdir(path.dirname(ytDlpBinary), { recursive: true });
    await YtDlpWrap.downloadFromGithub(ytDlpBinary);
    await fs.chmod(ytDlpBinary, '755');
    logger.info('yt-dlp téléchargé avec succès');
  }
};

// Initialisation au démarrage
ensureYtDlpExists().catch(err => {
  logger.error('Erreur initialisation yt-dlp:', err);
});

// Fonction pour valider une URL
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

// Extraire la plateforme depuis l'URL
const extractPlatform = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    const platforms = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'tiktok.com': 'TikTok',
      'twitter.com': 'Twitter/X',
      'x.com': 'Twitter/X',
      'instagram.com': 'Instagram',
      'facebook.com': 'Facebook',
      'fb.watch': 'Facebook',
      'vimeo.com': 'Vimeo',
      'dailymotion.com': 'Dailymotion',
      'twitch.tv': 'Twitch',
      'reddit.com': 'Reddit',
      'tumblr.com': 'Tumblr',
      'pinterest.com': 'Pinterest',
      'linkedin.com': 'LinkedIn'
    };
    
    for (const [domain, platform] of Object.entries(platforms)) {
      if (hostname.includes(domain)) {
        return platform;
      }
    }
    
    return hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
};

// Fonction principale pour récupérer les infos vidéo
const getVideoInfo = async (url) => {
  if (!isValidUrl(url)) {
    const error = new Error('URL invalide ou malformée');
    error.statusCode = 400;
    throw error;
  }

  try {
    logger.info(`Récupération des informations pour: ${url}`);
    
    // Options yt-dlp
    const options = [
      '--no-warnings',
      '--no-progress',
      '--dump-json',
      '--no-playlist',
      '--geo-bypass',
      '--no-check-certificate'
    ];

    // Exécuter yt-dlp
    const metadata = await ytDlpWrap.getVideoInfo(url, options);

    // Formater les formats vidéo
    const videoFormats = (metadata.formats || [])
      .filter(f => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none')
      .map(f => ({
        format_id: f.format_id,
        quality: f.format_note || f.quality_label || `${f.height || 0}p`,
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx || null,
        filesize_mb: f.filesize ? Math.round(f.filesize / 1024 / 1024 * 10) / 10 : null,
        url: f.url,
        resolution: f.resolution || `${f.width || 0}x${f.height || 0}`,
        width: f.width || null,
        height: f.height || null,
        fps: f.fps || null,
        vcodec: f.vcodec,
        acodec: f.acodec,
        bitrate: f.tbr || null,
        has_audio: f.acodec !== 'none'
      }))
      .sort((a, b) => {
        // Trier par hauteur, puis par bitrate
        if (b.height !== a.height) return (b.height || 0) - (a.height || 0);
        return (b.bitrate || 0) - (a.bitrate || 0);
      });

    // Formater les formats audio
    const audioFormats = (metadata.formats || [])
      .filter(f => (!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none')
      .map(f => ({
        format_id: f.format_id,
        quality: f.abr ? `${Math.round(f.abr)}kbps` : 'Audio',
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx || null,
        filesize_mb: f.filesize ? Math.round(f.filesize / 1024 / 1024 * 10) / 10 : null,
        url: f.url,
        acodec: f.acodec,
        abr: f.abr || null,
        asr: f.asr || null
      }))
      .sort((a, b) => (b.abr || 0) - (a.abr || 0));

    // Générer un ID unique pour cette vidéo
    const videoId = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);

    // Construire la réponse
    const videoData = {
      success: true,
      id: videoId,
      metadata: {
        title: metadata.title || 'Sans titre',
        duration: metadata.duration || 0,
        duration_formatted: formatDuration(metadata.duration),
        thumbnail: selectBestThumbnail(metadata.thumbnails) || metadata.thumbnail,
        description: metadata.description?.substring(0, 500) || null,
        uploader: metadata.uploader || metadata.channel || 'Inconnu',
        uploader_url: metadata.uploader_url || metadata.channel_url || null,
        view_count: metadata.view_count || 0,
        like_count: metadata.like_count || null,
        upload_date: metadata.upload_date || null,
        webpage_url: metadata.webpage_url || url,
        platform: extractPlatform(url),
        age_limit: metadata.age_limit || 0,
        is_live: metadata.is_live || false,
        was_live: metadata.was_live || false,
        categories: metadata.categories || [],
        tags: metadata.tags || []
      },
      formats: {
        video: videoFormats,
        audio: audioFormats,
        best: selectBestFormats(videoFormats, audioFormats)
      },
      _cached_at: new Date().toISOString()
    };
    
    return videoData;

  } catch (err) {
    logger.error(`Erreur yt-dlp pour ${url}:`, err);
    
    // Gestion des erreurs spécifiques
    let statusCode = 500;
    let message = 'Impossible de traiter la vidéo';
    
    const errorString = err.message || err.toString();
    
    if (errorString.includes('Unsupported URL') || errorString.includes('is not a valid URL')) {
      statusCode = 400;
      message = 'URL non supportée ou invalide';
    } else if (errorString.includes('Video unavailable') || errorString.includes('Private video') || errorString.includes('has been removed')) {
      statusCode = 404;
      message = 'Vidéo non disponible, privée ou supprimée';
    } else if (errorString.includes('429') || errorString.includes('Too Many Requests')) {
      statusCode = 429;
      message = 'Trop de requêtes. Veuillez réessayer dans quelques instants';
    } else if (errorString.includes('Sign in to confirm') || errorString.includes('age-restricted')) {
      statusCode = 403;
      message = 'Cette vidéo nécessite une connexion ou est soumise à une limite d\'âge';
    } else if (errorString.includes('yt-dlp: error:')) {
      message = errorString.split('yt-dlp: error:')[1]?.trim() || message;
    }
    
    const error = new Error(message);
    error.statusCode = statusCode;
    error.originalError = err.message;
    throw error;
  }
};

// Obtenir l'URL de téléchargement direct
const getDirectDownloadUrl = async (url, formatId) => {
  try {
    const options = [
      '--get-url',
      '-f', formatId,
      '--no-warnings',
      '--no-progress'
    ];

    const result = await ytDlpWrap.execPromise([url, ...options]);
    const downloadUrl = result.trim();

    if (!downloadUrl || !isValidUrl(downloadUrl)) {
      throw new Error('URL de téléchargement invalide');
    }

    return downloadUrl;
  } catch (err) {
    logger.error(`Erreur obtention URL directe: ${err.message}`);
    throw new Error('Impossible d\'obtenir l\'URL de téléchargement');
  }
};

// Helpers
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const selectBestThumbnail = (thumbnails) => {
  if (!thumbnails || !Array.isArray(thumbnails)) return null;
  
  // Préférer les thumbnails avec une largeur entre 320 et 1280
  const suitable = thumbnails.filter(t => t.width >= 320 && t.width <= 1280);
  if (suitable.length > 0) {
    return suitable.sort((a, b) => b.width - a.width)[0].url;
  }
  
  // Sinon prendre la plus grande
  return thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || null;
};

const selectBestFormats = (videoFormats, audioFormats) => {
  const best = {
    video: null,
    audio: null
  };

  // Meilleure vidéo : 1080p max pour l'équilibre taille/qualité
  best.video = videoFormats.find(f => f.height <= 1080) || videoFormats[0];

  // Meilleur audio : environ 128kbps
  best.audio = audioFormats.find(f => f.abr && f.abr >= 128 && f.abr <= 192) || audioFormats[0];

  return best;
};

// Mettre à jour yt-dlp périodiquement
const updateYtDlp = async () => {
  try {
    logger.info('Vérification des mises à jour yt-dlp...');
    const result = await ytDlpWrap.execPromise(['--update']);
    logger.info('yt-dlp mis à jour:', result);
  } catch (err) {
    logger.error('Erreur mise à jour yt-dlp:', err);
  }
};

// Mettre à jour toutes les 24h
if (process.env.NODE_ENV === 'production') {
  setInterval(updateYtDlp, 24 * 60 * 60 * 1000);
}

module.exports = {
  getVideoInfo,
  getDirectDownloadUrl,
  extractPlatform,
  updateYtDlp
};
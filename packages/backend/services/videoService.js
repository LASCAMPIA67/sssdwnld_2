// packages/backend/services/videoService.js

const YtDlpWrap = require('yt-dlp-wrap');
const path = require('path');
const logger = require('../config/logger');

// Initialise yt-dlp-wrap. Le binaire sera téléchargé s'il n'existe pas.
const ytDlpWrap = new YtDlpWrap();
ytDlpWrap.setBinPath(path.join(__dirname, '..', 'bin'));

// Fonction pour valider une URL (simple)
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const getVideoInfo = async (url) => {
  if (!isValidUrl(url)) {
    const error = new Error('URL invalide ou malformée.');
    error.statusCode = 400;
    throw error;
  }

  try {
    logger.info(`Récupération des informations pour l'URL: ${url}`);
    
    // Récupère les métadonnées et formats en une seule commande pour plus d'efficacité
    const metadata = await ytDlpWrap.getVideoInfo(url);

    // Filtrer et formater les résultats
    const videoFormats = metadata.formats
        .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
        .map(f => ({
            format_id: f.format_id,
            quality: f.format_note || `${f.height}p`,
            ext: f.ext,
            filesize: f.filesize,
            url: f.url,
            resolution: f.resolution,
            fps: f.fps,
            vcodec: f.vcodec,
            acodec: f.acodec
        }))
        .sort((a, b) => (b.height || 0) - (a.height || 0)); // Trie par qualité décroissante

    const audioFormats = metadata.formats
        .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
        .map(f => ({
            format_id: f.format_id,
            quality: `${Math.round(f.abr)}kbps`,
            ext: f.ext,
            filesize: f.filesize,
            url: f.url,
            acodec: f.acodec
        }))
        .sort((a, b) => b.abr - a.abr);

    const videoData = {
        success: true,
        metadata: {
            title: metadata.title,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            description: metadata.description,
            uploader: metadata.uploader,
            view_count: metadata.view_count,
            upload_date: metadata.upload_date,
            webpage_url: metadata.webpage_url,
        },
        formats: {
            video: videoFormats,
            audio: audioFormats,
        }
    };
    
    return videoData;

  } catch (err) {
    logger.error(`Erreur avec yt-dlp pour l'URL ${url}: ${err.message}`, { stack: err.stack, fullError: err });
    // Propage une erreur plus significative pour le errorHandler
    const error = new Error(`Impossible de traiter la vidéo. ${err.message}`);
    error.statusCode = 500;
    if (err.message.includes('Unsupported URL')) error.statusCode = 400;
    if (err.message.includes('Video unavailable')) error.statusCode = 404;
    throw error;
  }
};

module.exports = {
  getVideoInfo,
};
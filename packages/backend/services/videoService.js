const YtDlpWrap = require('yt-dlp-wrap');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../config/logger');

const ytDlpBinary = process.env.YT_DLP_BINARY_PATH || path.join(__dirname, '..', 'bin', 'yt-dlp');
const ytDlpWrap = new YtDlpWrap(ytDlpBinary);

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const extractPlatform = (url) => {
  try {
    const { hostname } = new URL(url);
    const domain = hostname.replace('www.', '');
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'YouTube';
    if (domain.includes('tiktok.com')) return 'TikTok';
    if (domain.includes('twitter.com') || domain.includes('x.com')) return 'Twitter/X';
    if (domain.includes('instagram.com')) return 'Instagram';
    return domain.split('.')[0];
  } catch {
    return 'Unknown';
  }
};

const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    return new Date(seconds * 1000).toISOString().substr(11, 8);
};

const getVideoInfo = async (url) => {
  if (!isValidUrl(url)) {
    const error = new Error('Invalid or malformed URL');
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  try {
    const metadata = await ytDlpWrap.getVideoInfo(url, ['--no-playlist', '--dump-json']);
    
    const videoFormats = (metadata.formats || [])
      .filter(f => f.vcodec && f.vcodec !== 'none')
      .map(f => ({
        format_id: f.format_id,
        quality: f.format_note || `${f.height || 0}p`,
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx || null,
        url: f.url,
        resolution: f.resolution || `${f.width || 0}x${f.height || 0}`,
        fps: f.fps || null,
        has_audio: f.acodec !== 'none',
      })).sort((a, b) => (b.height || 0) - (a.height || 0));

    const audioFormats = (metadata.formats || [])
      .filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
      .map(f => ({
        format_id: f.format_id,
        quality: f.abr ? `${Math.round(f.abr)}kbps` : 'Audio',
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx || null,
        url: f.url,
      })).sort((a, b) => (b.abr || 0) - (a.abr || 0));

    return {
      success: true,
      metadata: {
        title: metadata.title || 'Untitled',
        duration: metadata.duration || 0,
        duration_formatted: formatDuration(metadata.duration),
        thumbnail: metadata.thumbnail || null,
        uploader: metadata.uploader || 'Unknown',
        view_count: metadata.view_count || 0,
        platform: extractPlatform(url),
      },
      formats: { video: videoFormats, audio: audioFormats },
    };
  } catch (err) {
    logger.error(`yt-dlp error for ${url}:`, err);
    const error = new Error('Failed to process video. The URL might be unsupported or the video is private/unavailable.');
    error.statusCode = 500;
    error.isOperational = true;
    throw error;
  }
};

module.exports = { getVideoInfo };
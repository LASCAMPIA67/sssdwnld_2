// packages/backend/routes/health.js - CRÉER CE FICHIER
const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sssdwnld-api',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Vérifier yt-dlp
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const { stdout } = await execAsync('yt-dlp --version');
    health.ytdlp = stdout.trim();
  } catch (error) {
    health.ytdlp = 'not installed';
    health.status = 'degraded';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

module.exports = router;
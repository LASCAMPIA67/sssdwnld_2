const express = require('express');
const router = express.Router();
const { redisClient } = require('../middleware/cache');
const { exec } = require('child_process');

router.get('/', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    checks: {},
  };

  try {
    const redisStatus = redisClient.isOpen ? 'ok' : 'error';
    if(redisStatus === 'ok') await redisClient.ping();
    healthcheck.checks.redis = redisStatus;
  } catch (e) {
    healthcheck.status = 'degraded';
    healthcheck.checks.redis = 'error';
  }

  try {
    await new Promise((resolve, reject) => {
        exec('yt-dlp --version', (error, stdout) => {
            if (error) return reject(error);
            healthcheck.checks.ytdlp = stdout.trim();
            resolve();
        });
    });
  } catch (e) {
    healthcheck.status = 'degraded';
    healthcheck.checks.ytdlp = 'error';
  }

  res.status(healthcheck.status === 'ok' ? 200 : 503).json(healthcheck);
});

module.exports = router;
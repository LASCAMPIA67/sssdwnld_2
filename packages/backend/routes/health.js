const express = require('express');
const router = express.Router();
const os = require('os');
const redis = require('redis');

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sssdwnld-api',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: os.platform(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg()
    }
  };

  // Vérifier Redis
  try {
    const client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    await client.connect();
    await client.ping();
    health.redis = 'connected';
    await client.quit();
  } catch (error) {
    health.redis = 'disconnected';
    health.status = 'degraded';
  }

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

// Route de monitoring simple
router.get('/metrics', (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    pid: process.pid,
    version: process.version
  };
  
  res.json(metrics);
});

module.exports = router;
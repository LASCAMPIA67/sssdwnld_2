// packages/backend/routes/stats.js
const express = require('express');
const router = express.Router();
const os = require('os');
const { getCacheStats } = require('../middleware/cache');
const logger = require('../config/logger');

/**
 * GET /api/v1/stats
 * Récupère les statistiques du serveur
 */
router.get('/', async (req, res) => {
  try {
    const stats = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        version: process.version,
        platform: process.platform
      },
      system: {
        hostname: os.hostname(),
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length
      },
      cache: await getCacheStats(),
      app: {
        name: process.env.APP_NAME || 'sssdwnld',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    logger.error('Erreur récupération stats:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * GET /api/v1/stats/metrics
 * Métriques simplifiées pour monitoring
 */
router.get('/metrics', async (req, res) => {
  const memUsage = process.memoryUsage();
  const cacheStats = await getCacheStats();
  
  // Format Prometheus
  const metrics = `
# HELP nodejs_heap_size_total_bytes Process heap size from Node.js
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes ${memUsage.heapTotal}

# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes ${memUsage.heapUsed}

# HELP nodejs_external_memory_bytes Process external memory from Node.js
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${memUsage.external}

# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total ${(process.cpuUsage().user + process.cpuUsage().system) / 1000000}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP redis_connected Redis connection status
# TYPE redis_connected gauge
redis_connected ${cacheStats.connected ? 1 : 0}

# HELP redis_keys_total Total number of keys in Redis
# TYPE redis_keys_total gauge
redis_keys_total ${cacheStats.keys || 0}
`.trim();

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

module.exports = router;
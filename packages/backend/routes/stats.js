const express = require('express');
const router = express.Router();
const os = require('os');
const { getCacheStats } = require('../middleware/cache');

router.get('/', async (req, res, next) => {
  try {
    const [mem, cpus, cache] = await Promise.all([
      process.memoryUsage(),
      os.cpus(),
      getCacheStats()
    ]);

    const stats = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memory: mem,
        pid: process.pid,
        platform: process.platform
      },
      system: {
        loadavg: os.loadavg(),
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        cpus: cpus.length
      },
      cache
    };
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
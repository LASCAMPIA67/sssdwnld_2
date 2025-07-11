
// packages/backend/middleware/cache.js
const redis = require('redis');
const logger = require('../config/logger');

// Configuration Redis
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0,
  lazyConnect: true
});

// Gestion des événements Redis
redisClient.on('connect', () => {
  logger.info('✅ Redis connecté');
});

redisClient.on('error', (err) => {
  logger.error('❌ Erreur Redis:', err);
});

redisClient.on('ready', () => {
  logger.info('✅ Redis prêt');
});

// Connexion initiale
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Impossible de se connecter à Redis:', err);
  }
})();

// Helper pour générer des clés de cache
const getCacheKey = (type, identifier) => {
  return `sssdwnld:${type}:${identifier}`;
};

// Middleware pour vérifier le cache
const checkCache = async (req, res, next) => {
  // Skip si Redis n'est pas connecté
  if (!redisClient.isOpen) {
    return next();
  }

  const { url } = req.body;
  if (!url) return next();

  try {
    const cacheKey = getCacheKey('video', url);
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      logger.info('Cache hit pour:', url);
      return res.json(JSON.parse(cached));
    }

    // Attacher la fonction de cache à la requête
    req.cache = {
      set: async (key, value, ttl = 3600) => {
        try {
          const cacheKey = getCacheKey('video', key);
          await redisClient.setEx(cacheKey, ttl, JSON.stringify(value));
          logger.debug('Mis en cache:', cacheKey);
        } catch (err) {
          logger.error('Erreur mise en cache:', err);
        }
      }
    };

    next();
  } catch (err) {
    logger.error('Erreur vérification cache:', err);
    next();
  }
};

// Middleware générique pour le cache
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    if (!redisClient.isOpen) {
      return next();
    }

    const cacheKey = getCacheKey('response', req.originalUrl);

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit pour route:', req.originalUrl);
        return res.json(JSON.parse(cached));
      }

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = function(data) {
        res.json = originalJson;
        if (res.statusCode === 200) {
          redisClient.setEx(cacheKey, ttl, JSON.stringify(data))
            .catch(err => logger.error('Erreur cache réponse:', err));
        }
        return res.json(data);
      };

      next();
    } catch (err) {
      logger.error('Erreur middleware cache:', err);
      next();
    }
  };
};

// Fonction pour invalider le cache
const invalidateCache = async (pattern) => {
  if (!redisClient.isOpen) return;

  try {
    const keys = await redisClient.keys(`sssdwnld:${pattern}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache invalidé: ${keys.length} clés supprimées`);
    }
  } catch (err) {
    logger.error('Erreur invalidation cache:', err);
  }
};

// Statistiques du cache
const getCacheStats = async () => {
  if (!redisClient.isOpen) {
    return { connected: false };
  }

  try {
    const info = await redisClient.info('stats');
    const dbSize = await redisClient.dbSize();
    
    return {
      connected: true,
      keys: dbSize,
      info: info
    };
  } catch (err) {
    logger.error('Erreur stats cache:', err);
    return { connected: false, error: err.message };
  }
};

// Nettoyage à l'arrêt
process.on('SIGINT', async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis déconnecté proprement');
  }
});

module.exports = {
  redisClient,
  checkCache,
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  getCacheKey
};
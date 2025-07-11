const redis = require('redis');
const logger = require('../config/logger');

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: retries => Math.min(retries * 50, 2000)
  }
});

redisClient.on('connect', () => logger.info('Connecting to Redis...'));
redisClient.on('ready', () => logger.info('Redis is ready.'));
redisClient.on('error', err => logger.error('Redis Connection Error:', err));
redisClient.connect().catch(err => {
    logger.error("Initial Redis connection failed. Cache will be unavailable.", err);
});

const getCacheKey = (req) => `cache:${req.originalUrl}`;

const checkCache = async (req, res, next) => {
  if (!redisClient.isOpen) return next();
  const cacheKey = getCacheKey(req);
  try {
    const data = await redisClient.get(cacheKey);
    if (data) {
      return res.json(JSON.parse(data));
    }
    next();
  } catch (err) {
    logger.error('Cache read error:', err);
    next();
  }
};

const setCache = (key, data, ttl = 1800) => {
  if (!redisClient.isOpen) return;
  redisClient.setEx(`cache:${key}`, ttl, JSON.stringify(data))
    .catch(err => logger.error('Cache write error:', err));
};

const getCacheStats = async () => {
    if (!redisClient.isOpen) return { connected: false };
    try {
        const [info, dbSize] = await Promise.all([
            redisClient.info('stats'),
            redisClient.dbSize()
        ]);
        return { connected: true, keys: dbSize, info };
    } catch (err) {
        return { connected: false, error: err.message };
    }
};

module.exports = { redisClient, checkCache, setCache, getCacheStats };
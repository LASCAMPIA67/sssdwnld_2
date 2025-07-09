// packages/backend/server.js - REMPLACER TOUT LE FICHIER
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const winston = require('winston');
const redis = require('redis');
const RedisStore = require('rate-limit-redis');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const downloadRoutes = require('./routes/download');
const healthRoutes = require('./routes/health');
const { errorHandler } = require('./middleware/errorHandler');

// Configuration Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sssdwnld-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 3000;

// Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => logger.error('Redis Error:', err));
redisClient.connect();

// Middlewares de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression
app.use(compression());

// CORS configuré
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://sssdwnld.com', 'https://www.sssdwnld.com']
    : ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting avec Redis
const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Trust proxy
app.set('trust proxy', 1);

// Routes
app.use('/api/v1/download', downloadRoutes);
app.use('/api/v1/health', healthRoutes);

// Servir le frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../packages/frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../packages/frontend/dist/index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.url} n'existe pas`
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Arrêt gracieux en cours...');
  redisClient.quit();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Démarrage serveur
app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════╗
║       sssdwnld API Server              ║
║       Version: ${process.env.npm_package_version || '1.0.0'}                    ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                           ║
║  Environnement: ${process.env.NODE_ENV || 'development'}         ║
║  Redis: ${redisClient.isOpen ? 'Connecté' : 'Déconnecté'}                   ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
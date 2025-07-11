// packages/backend/server.js

"use strict";

// Charger les variables d'environnement
require("dotenv").config({ path: require('path').join(__dirname, '.env') });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");

const logger = require("./config/logger");
const { errorHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');
const { specs, swaggerUi } = require('./config/swagger');

// === Initialisation de l'app Express ===
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ENV = process.env.NODE_ENV || "development";

// === Configuration de base ===
app.set("trust proxy", 1);
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE || "10mb" }));

// === Sécurité ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.google-analytics.com"]
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(sanitizeInput);

// === CORS Configuration ===
const corsWhitelist = (process.env.CORS_ORIGIN || "").split(',').filter(Boolean);
if (ENV === 'development') {
  corsWhitelist.push("http://localhost:5173", "http://127.0.0.1:5173");
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsWhitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 heures
};
app.use(cors(corsOptions));

// === Logging ===
const morganFormat = ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// === Rate Limiting ===
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({ error: true, message });
  }
});

// Limiteur global
const globalLimiter = createRateLimiter(
  (process.env.RATE_LIMIT_WINDOW_MIN || 15) * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  "Trop de requêtes, veuillez réessayer plus tard."
);

// Limiteur strict pour l'API download
const downloadLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // 20 requêtes max
  "Limite de téléchargement atteinte. Veuillez patienter 5 minutes."
);

app.use("/api/", globalLimiter);
app.use("/api/v1/download", downloadLimiter);

// === Documentation API (dev seulement) ===
if (ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  logger.info('Documentation API disponible sur /api-docs');
}

// === Routes API ===
const downloadRoutes = require("./routes/download");
const healthRoutes = require("./routes/health");
const statsRoutes = require("./routes/stats");

app.use("/api/v1/download", downloadRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/stats", statsRoutes);

// === Servir le frontend en production ===
if (ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../frontend/dist");
  
  // Vérifier que le dossier existe
  const fs = require('fs');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    // Route catch-all pour le SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  } else {
    logger.warn('Frontend build not found. Run npm run build first.');
  }
}

// === Gestionnaire de 404 (API seulement) ===
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: true,
    message: `La route ${req.method} ${req.originalUrl} n'existe pas.`,
    available_endpoints: [
      'POST /api/v1/download',
      'GET /api/v1/download/supported',
      'GET /api/v1/health',
      'GET /api/v1/stats'
    ]
  });
});

// === Gestionnaire d'erreurs centralisé ===
app.use(errorHandler);

// === Gestion propre de l'arrêt ===
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} reçu. Arrêt gracieux en cours...`);
  
  // Arrêter d'accepter de nouvelles connexions
  server.close(() => {
    logger.info('Serveur HTTP fermé');
  });

  // Fermer Redis
  try {
    const { redisClient } = require('./middleware/cache');
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis déconnecté');
    }
  } catch (err) {
    logger.error('Erreur fermeture Redis:', err);
  }

  // Attendre un peu pour finir les requêtes en cours
  setTimeout(() => {
    logger.info('Arrêt forcé');
    process.exit(0);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// === Lancement du serveur ===
const server = app.listen(PORT, HOST, () => {
  logger.info(`
╔════════════════════════════════════════╗
║        sssdwnld API Server             ║
╠════════════════════════════════════════╣
║  Version: ${process.env.APP_VERSION || '1.0.0'}
║  Port: ${PORT}
║  Host: ${HOST}
║  Environnement: ${ENV}
║  PID: ${process.pid}
║  Node: ${process.version}
╚════════════════════════════════════════╝
  `);

  if (ENV === 'development') {
    logger.info(`API: http://localhost:${PORT}/api/v1`);
    logger.info(`Docs: http://localhost:${PORT}/api-docs`);
  }
});

// Export pour les tests
module.exports = app;
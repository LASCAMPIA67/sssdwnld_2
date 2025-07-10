// packages/backend/server.js

"use strict";

// Charger les variables d'environnement le plus tôt possible
require("dotenv").config({ path: require('path').join(__dirname, '.env') });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");

const logger = require("./config/logger"); // NOUVEAU: Logger Winston
const { errorHandler } = require('./middleware/errorHandler');

// === Initialisation de l'app Express ===
const app = express();
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || "development";

// === Configuration de base ===
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// === Sécurité ===
// Helmet avec une politique de sécurité de contenu plus robuste
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaults().directives,
      "script-src": ["'self'", "https://www.googletagmanager.com"],
    },
  },
}));
app.use(compression());

// Configuration CORS plus sécurisée pour la production
const corsWhitelist = (process.env.CORS_ORIGIN || "").split(',').filter(Boolean);
if (ENV === 'development') {
    corsWhitelist.push("http://localhost:5173", "http://127.0.0.1:5173");
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsWhitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS: Origine non autorisée par la politique CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));


// === Logging ===
// Utilise morgan pour les logs HTTP, pipés dans Winston
app.use(morgan("combined", { stream: logger.stream }));


// === Limiteur de requêtes ===
const apiLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW_MIN || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: "Trop de requêtes, veuillez réessayer plus tard." }
});
app.use("/api/", apiLimiter);


// === Routes API ===
const downloadRoutes = require("./routes/download");
const healthRoutes = require("./routes/health");

app.use("/api/v1/download", downloadRoutes);
app.use("/api/v1/health", healthRoutes);


// === Servir le frontend en production ===
if (ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// === Gestionnaire de 404 (API seulement) ===
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: true,
    message: `La route ${req.method} ${req.originalUrl} n'existe pas.`
  });
});


// === Gestionnaire d'erreurs centralisé ===
app.use(errorHandler);

// === Lancement du serveur ===
app.listen(PORT, "0.0.0.0", () => {
    logger.info(`
    ╔════════════════════════════════════════╗
    ║        sssdwnld API Server             ║
    ╠════════════════════════════════════════╣
    ║  Port: ${PORT}
    ║  Environnement: ${ENV}
    ╚════════════════════════════════════════╝
    `);
});

module.exports = app;
// packages/backend/server.js

"use strict";

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// === Création du dossier logs si inexistant ===
const logsDir = path.resolve(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), { flags: "a" });

// === Initialisation de l'app Express ===
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ENV = process.env.NODE_ENV || "development";

// === Trust proxy pour gestion X-Forwarded-For correcte ===
app.set("trust proxy", 1);

// === Sécurité avec helmet ===
app.use(helmet({
  contentSecurityPolicy: ENV === "production" ? undefined : false,
  crossOriginEmbedderPolicy: false, // parfois utile en prod selon ton frontend
}));

// === Compression GZIP ===
app.use(compression());

// === CORS Multi-origines dynamique ===
const corsWhitelist = ENV === "production"
  ? [
      "https://sssdwnld.com",
      "https://www.sssdwnld.com",
      "http://sssdwnld.com",
      "http://www.sssdwnld.com"
    ]
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Autorise les requêtes sans origine (ex: mobile, curl)
    if (!origin) return callback(null, true);
    if (corsWhitelist.includes(origin)) return callback(null, true);
    return callback(new Error("CORS: Origin non autorisée"));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// === Logging requêtes HTTP dans access.log ===
app.use(morgan("combined", { stream: accessLogStream }));

// === Parsing du body ===
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// === Limiteur de rate (API only) ===
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 150,
  standardHeaders: true, // Retourne RateLimit-*
  legacyHeaders: false,  // Désactive X-RateLimit-*
  message: { error: true, message: "Trop de requêtes, réessayez plus tard." }
});
app.use("/api/", apiLimiter);

// === Import des routes ===
const downloadRoutes = require("./routes/download");
const healthRoutes = require("./routes/health");

// === Routing API ===
app.use("/api/v1/download", downloadRoutes);
app.use("/api/v1/health", healthRoutes);

// === Static: Servir le frontend en production ===
if (ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// === 404 handler API ===
app.use("/api", (req, res) => {
  res.status(404).json({
    error: true,
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`
  });
});

// === 404 handler pour le reste (hors API, par ex. mauvaise route SPA) ===
app.use((req, res, next) => {
  if (ENV === "production") {
    // Laisse le frontend gérer les 404 SPA
    const frontendDist = path.resolve(__dirname, "../frontend/dist");
    return res.sendFile(path.join(frontendDist, "index.html"));
  }
  res.status(404).json({
    error: true,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`
  });
});

// === Gestion centralisée des erreurs ===
app.use((err, req, res, next) => {
  // Pour éviter crash sur les erreurs inattendues
  console.error("Erreur Express:", err);
  if (err.message && err.message.startsWith("CORS")) {
    return res.status(403).json({ error: true, message: err.message });
  }
  res.status(500).json({
    error: true,
    message: "Erreur serveur interne",
    ...(ENV !== "production" && { details: err.message })
  });
});

// === Lancement du serveur ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════╗
║        sssdwnld API Server            ║
║        Version: 1.0.0                 ║
╠════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(32)}║
║  Environnement: ${ENV.padEnd(20)}║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
 f
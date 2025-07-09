// packages/backend/server.js - REMPLACER TOUT LE FICHIER
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Créer les dossiers de logs s'ils n'existent pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuration simple de logging
const logStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(helmet({
  contentSecurityPolicy: false // Désactivé pour simplifier
}));

// Compression
app.use(compression());

// CORS configuré
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://sssdwnld.com', 'https://www.sssdwnld.com', 'http://sssdwnld.com', 'http://www.sssdwnld.com']
    : ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: logStream }));

// Rate limiting simple (sans Redis pour commencer)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});

app.use('/api/', limiter);

// Trust proxy
app.set('trust proxy', 1);

// Import des routes
const downloadRoutes = require('./routes/download');
const healthRoutes = require('./routes/health');

// Routes
app.use('/api/v1/download', downloadRoutes);
app.use('/api/v1/health', healthRoutes);

// Servir le frontend en production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.url} n'existe pas`
  });
});

// Error handler simple
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ 
    error: true,
    message: 'Une erreur interne est survenue',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Démarrage serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║       sssdwnld API Server              ║
║       Version: 1.0.0                   ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                           ║
║  Environnement: ${process.env.NODE_ENV || 'development'}         ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
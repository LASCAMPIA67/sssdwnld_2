// packages/backend/middleware/validation.js
const { body, validationResult } = require('express-validator');

// Middleware pour vérifier les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Données de requête invalides',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validateurs réutilisables
const validators = {
  // Validation d'URL vidéo
  videoUrl: body('url')
    .trim()
    .notEmpty().withMessage('L\'URL est requise')
    .isURL({ 
      protocols: ['http', 'https'],
      require_protocol: true 
    }).withMessage('URL invalide')
    .isLength({ max: 2048 }).withMessage('URL trop longue')
    .custom((value) => {
      // Liste noire de domaines
      const blacklistedDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '192.168.',
        '10.',
        '172.'
      ];
      
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      
      // Vérifier les domaines internes
      for (const domain of blacklistedDomains) {
        if (hostname.includes(domain)) {
          throw new Error('Les URLs internes ne sont pas autorisées');
        }
      }
      
      // Vérifier les protocoles non supportés
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Seuls les protocoles HTTP et HTTPS sont supportés');
      }
      
      return true;
    })
    .custom((value) => {
      // Vérifier les plateformes supportées (optionnel)
      const supportedPlatforms = [
        'youtube.com',
        'youtu.be',
        'tiktok.com',
        'twitter.com',
        'x.com',
        'instagram.com',
        'facebook.com',
        'fb.watch',
        'vimeo.com',
        'dailymotion.com',
        'twitch.tv',
        'reddit.com',
        'tumblr.com'
      ];
      
      try {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase();
        
        // Autoriser toutes les URLs mais logger les non-supportées
        const isSupported = supportedPlatforms.some(platform => 
          hostname.includes(platform)
        );
        
        if (!isSupported) {
          console.warn(`URL from unsupported platform: ${hostname}`);
        }
        
        return true;
      } catch {
        throw new Error('URL invalide');
      }
    }),

  // Validation de format ID
  formatId: body('format_id')
    .trim()
    .notEmpty().withMessage('L\'ID du format est requis')
    .isAlphanumeric('en-US', { ignore: '-_' }).withMessage('ID de format invalide')
    .isLength({ min: 1, max: 50 }).withMessage('ID de format invalide'),

  // Validation de rapport de problème
  reportIssue: [
    body('url')
      .optional()
      .trim()
      .isURL().withMessage('URL invalide'),
    body('message')
      .trim()
      .notEmpty().withMessage('Le message est requis')
      .isLength({ min: 10, max: 1000 }).withMessage('Le message doit contenir entre 10 et 1000 caractères')
      .escape(), // Échapper le HTML
    body('email')
      .optional()
      .trim()
      .normalizeEmail()
      .isEmail().withMessage('Email invalide')
  ]
};

// Middleware de sanitization générale
const sanitizeInput = (req, res, next) => {
  // Nettoyer les chaînes dans le body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Supprimer les caractères de contrôle
        req.body[key] = req.body[key].replace(/[\x00-\x1F\x7F]/g, '');
      }
    });
  }
  
  // Nettoyer les query params
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/[\x00-\x1F\x7F]/g, '');
      }
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validators,
  sanitizeInput
};
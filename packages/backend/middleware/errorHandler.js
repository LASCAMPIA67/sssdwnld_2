const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' })
  ]
});

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Gestion des différents types d'erreurs
  let statusCode = 500;
  let message = 'Une erreur interne est survenue';

  const errorString = err.message || err.toString();

  if (errorString.includes('Unsupported URL') || errorString.includes('not a valid URL')) {
    message = 'URL non supportée. Veuillez vérifier que l\'URL est valide.';
    statusCode = 400;
  } else if (errorString.includes('Video unavailable') || errorString.includes('Private video')) {
    message = 'Vidéo non disponible, privée ou supprimée.';
    statusCode = 404;
  } else if (errorString.includes('429') || errorString.includes('Too Many Requests')) {
    message = 'Trop de requêtes vers la plateforme. Veuillez réessayer dans quelques instants.';
    statusCode = 429;
  } else if (errorString.includes('yt-dlp') && errorString.includes('not found')) {
    message = 'Service temporairement indisponible. Veuillez réessayer plus tard.';
    statusCode = 503;
  } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    message = 'La requête a pris trop de temps. Veuillez réessayer.';
    statusCode = 504;
  }

  res.status(statusCode).json({
    error: true,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      details: err.message,
      stack: err.stack 
    })
  });
};

module.exports = { errorHandler };
// packages/backend/config/logger.js
const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Configuration des transports
const transports = [];

// Rotation quotidienne des logs
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../logs/app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Transport pour les erreurs
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: logFormat
});

transports.push(fileRotateTransport);
transports.push(errorFileTransport);

// Console en développement
if (process.env.NODE_ENV !== 'production') {
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Stream pour Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Gérer les exceptions non capturées
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/exceptions.log') 
  })
);

// Gérer les promesses rejetées
logger.rejections.handle(
  new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/rejections.log') 
  })
);

module.exports = logger;
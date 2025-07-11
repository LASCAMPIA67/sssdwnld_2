const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.error(err.message, {
    statusCode,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  const response = {
    error: true,
    message: err.isOperational || !isProduction ? err.message : 'An internal server error occurred.',
  };
  
  if (!isProduction) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: true, errors: errors.array() });
  }
  next();
};

const validators = {
  videoUrl: body('url')
    .trim()
    .notEmpty().withMessage('URL is required.')
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Must be a valid URL.')
    .custom(value => {
        const url = new URL(value);
        if (['localhost', '127.0.0.1'].includes(url.hostname)) {
            throw new Error('Local URLs are not allowed.');
        }
        return true;
    })
};

const sanitizeInput = (req, res, next) => {
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].replace(/[\x00-\x1F\x7F]/g, '');
    }
  }
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key].replace(/[\x00-\x1F\x7F]/g, '');
    }
  }
  next();
};

module.exports = { handleValidationErrors, validators, sanitizeInput };
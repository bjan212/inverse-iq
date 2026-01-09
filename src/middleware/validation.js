/**
 * Input Validation Middleware
 * 
 * Provides validation rules for all API endpoints
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for submission endpoint
 */
const validateSubmission = [
  body('exchange')
    .trim()
    .notEmpty().withMessage('Exchange is required')
    .isIn(['binance', 'bybit', 'okx', 'mexc']).withMessage('Invalid exchange'),
  
  body('apiKey')
    .trim()
    .notEmpty().withMessage('API key is required')
    .isLength({ min: 10, max: 200 }).withMessage('Invalid API key length')
    .matches(/^[A-Za-z0-9_-]+$/).withMessage('API key contains invalid characters'),
  
  body('apiSecret')
    .trim()
    .notEmpty().withMessage('API secret is required')
    .isLength({ min: 10, max: 200 }).withMessage('Invalid API secret length'),
  
  body('walletAddress')
    .trim()
    .notEmpty().withMessage('Wallet address is required')
    .matches(/^T[A-Za-z0-9]{33}$/).withMessage('Invalid TRC20 wallet address'),
  
  body('network')
    .optional()
    .trim()
    .isIn(['TRC20', 'ERC20', 'BEP20']).withMessage('Invalid network'),
  
  body('connectionId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Connection ID too long'),
  
  handleValidationErrors
];

/**
 * Validation rules for signal outcome
 */
const validateSignalOutcome = [
  body('signalId')
    .trim()
    .notEmpty().withMessage('Signal ID is required')
    .isLength({ min: 5, max: 100 }).withMessage('Invalid signal ID length'),
  
  body('outcome')
    .trim()
    .notEmpty().withMessage('Outcome is required')
    .isIn(['win', 'loss']).withMessage('Outcome must be "win" or "loss"'),
  
  body('entryPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Entry price must be a positive number'),
  
  body('exitPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Exit price must be a positive number'),
  
  body('pnl')
    .optional()
    .isFloat().withMessage('PnL must be a number'),
  
  body('pnlPercentage')
    .optional()
    .isFloat({ min: -100, max: 1000 }).withMessage('PnL percentage must be between -100 and 1000'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long (max 500 characters)')
    .escape(),
  
  handleValidationErrors
];

/**
 * Validation rules for notification subscription
 */
const validateSubscription = [
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('telegramChatId')
    .optional()
    .trim()
    .matches(/^-?\d+$/).withMessage('Invalid Telegram chat ID'),
  
  body('preferences')
    .optional()
    .isObject().withMessage('Preferences must be an object'),
  
  body('preferences.channels')
    .optional()
    .isObject().withMessage('Channels must be an object'),
  
  body('preferences.channels.email')
    .optional()
    .isBoolean().withMessage('Email channel must be boolean'),
  
  body('preferences.channels.telegram')
    .optional()
    .isBoolean().withMessage('Telegram channel must be boolean'),
  
  body('preferences.minConfidence')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Min confidence must be between 0 and 100'),
  
  // Custom validation: at least one contact method required
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.telegramChatId) {
      throw new Error('At least one contact method (email or telegramChatId) is required');
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Validation rules for subscriber ID parameter
 */
const validateSubscriberId = [
  param('id')
    .trim()
    .notEmpty().withMessage('Subscriber ID is required')
    .isLength({ min: 5, max: 100 }).withMessage('Invalid subscriber ID length'),
  
  handleValidationErrors
];

/**
 * Validation rules for signal ID parameter
 */
const validateSignalId = [
  param('signalId')
    .trim()
    .notEmpty().withMessage('Signal ID is required')
    .isLength({ min: 5, max: 100 }).withMessage('Invalid signal ID length'),
  
  handleValidationErrors
];

/**
 * Validation rules for symbols query parameter
 */
const validateSymbols = [
  query('symbols')
    .optional()
    .trim()
    .matches(/^[A-Z,]+$/).withMessage('Symbols must be uppercase letters and commas only')
    .customSanitizer(value => {
      // Split, validate each symbol, and rejoin
      const symbols = value.split(',').filter(s => s.length > 0);
      return symbols.slice(0, 10).join(','); // Limit to 10 symbols
    }),
  
  handleValidationErrors
];

/**
 * Validation rules for register signal
 */
const validateRegisterSignal = [
  body('signalId')
    .trim()
    .notEmpty().withMessage('Signal ID is required')
    .isLength({ min: 5, max: 100 }).withMessage('Invalid signal ID length'),
  
  body('symbol')
    .trim()
    .notEmpty().withMessage('Symbol is required')
    .matches(/^[A-Z]+$/).withMessage('Symbol must be uppercase letters only')
    .isLength({ min: 3, max: 20 }).withMessage('Symbol length must be between 3 and 20'),
  
  body('direction')
    .trim()
    .notEmpty().withMessage('Direction is required')
    .isIn(['LONG', 'SHORT']).withMessage('Direction must be LONG or SHORT'),
  
  body('confidence')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Confidence must be between 0 and 100'),
  
  body('pattern')
    .optional()
    .isObject().withMessage('Pattern must be an object'),
  
  handleValidationErrors
];

/**
 * Sanitize HTML to prevent XSS
 */
const sanitizeHtml = (req, res, next) => {
  // Recursively sanitize all string values in body
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
};

module.exports = {
  validateSubmission,
  validateSignalOutcome,
  validateSubscription,
  validateSubscriberId,
  validateSignalId,
  validateSymbols,
  validateRegisterSignal,
  sanitizeHtml,
  handleValidationErrors
};

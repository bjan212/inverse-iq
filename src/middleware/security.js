/**
 * Security Middleware
 * 
 * Provides rate limiting, authentication, and security headers
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health check
  skip: (req) => req.path === '/api/health'
});

/**
 * Admin login rate limiter
 * Strict to slow brute force attempts
 */
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many admin login attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for submission endpoint
 * 5 submissions per hour per IP
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'Too many submissions from this IP. Maximum 5 submissions per hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Moderate rate limiter for feedback endpoints
 * 50 requests per 15 minutes per IP
 */
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    error: 'Too many feedback requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Moderate rate limiter for notification endpoints
 * 30 requests per 15 minutes per IP
 */
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    error: 'Too many notification requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin authentication middleware
 * Checks for valid API key in headers
 */
const authenticateAdmin = (req, res, next) => {
  // Allow authenticated admin sessions (login via /admin-login)
  if (req.session && req.session.isAdmin) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const adminApiKey = process.env.ADMIN_API_KEY;

  // If no admin key is configured, keep legacy open-access behavior
  if (!adminApiKey) {
    console.warn('⚠️  ADMIN_API_KEY not configured - admin endpoints are unprotected!');
    return next();
  }

  if (apiKey && apiKey === adminApiKey) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized - Invalid or missing credentials'
  });
};

/**
 * Helmet security headers configuration
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.ethers.io"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'", 
        "wss:", 
        "ws:", 
        "https:",
        "https://*.infura.io",
        "https://*.alchemy.com", 
        "https://*.binance.org",
        "https://*.arbitrum.io",
        "https://polygon-rpc.com",
        "https://eth.public-rpc.com",
        "https://bsc.publicnode.com",
        "https://arbitrum.public-rpc.com"
      ]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * CORS configuration
 */
const getCorsOptions = () => {
  const defaultLocalOrigins = [
    `http://localhost:${process.env.PORT || 3000}`,
    `http://127.0.0.1:${process.env.PORT || 3000}`,
    'http://localhost',
    'http://127.0.0.1'
  ];

  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : defaultLocalOrigins;

  if (process.env.SELF_ORIGIN) {
    allowedOriginsRaw.push(process.env.SELF_ORIGIN.trim());
  }

  // Normalize to be resilient to trailing slashes and casing
  const allowedOrigins = allowedOriginsRaw.map(o => o.toLowerCase().replace(/\/$/, ''));
  const allowLocalDev = process.env.NODE_ENV === 'development';
  
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (servers, curl, health checks)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
      const isExplicitlyAllowed = allowedOrigins.includes(normalizedOrigin);
      const isDevLocalhost = allowLocalDev && normalizedOrigin.startsWith('http://localhost');

      if (isExplicitlyAllowed || isDevLocalhost) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${normalizedOrigin}`);
      callback(null, false); // Respond without CORS headers instead of throwing 500
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
};

/**
 * Global error handler for unhandled rejections
 */
const setupGlobalErrorHandlers = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('   Reason:', reason);
    // In production, you might want to log to error tracking service (Sentry, etc.)
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Log error and gracefully shutdown
    console.error('   Shutting down gracefully...');
    process.exit(1);
  });
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    
    // Log errors with more detail
    if (res.statusCode >= 400) {
      console.error(`   IP: ${req.ip}`);
      console.error(`   User-Agent: ${req.get('user-agent')}`);
    }
  });
  
  next();
};

/**
 * IP whitelist middleware (optional)
 */
const ipWhitelist = (whitelist = []) => {
  return (req, res, next) => {
    // If no whitelist configured, allow all
    if (whitelist.length === 0) {
      return next();
    }
    
    const clientIp = req.ip || req.connection.remoteAddress;
    const normalizedClientIp = (clientIp || '').replace('::ffff:', '');
    const normalizedWhitelist = whitelist.map(ip => ip.replace('::ffff:', ''));

    if (normalizedWhitelist.includes(normalizedClientIp)) {
      next();
    } else {
      console.warn(`Admin IP whitelist blocked request from ${normalizedClientIp || 'unknown IP'}`);
      res.status(403).json({
        success: false,
        error: 'Access denied - IP not whitelisted'
      });
    }
  };
};

module.exports = {
  apiLimiter,
  submissionLimiter,
  feedbackLimiter,
  notificationLimiter,
  adminLoginLimiter,
  authenticateAdmin,
  helmetConfig,
  getCorsOptions,
  setupGlobalErrorHandlers,
  requestLogger,
  ipWhitelist
};

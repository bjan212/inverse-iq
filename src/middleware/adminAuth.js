// Secure admin authentication middleware using express-session and bcrypt
// Adds Redis-backed session storage for production reliability.
const session = require('express-session');
const bcrypt = require('bcrypt');
const { RedisStore } = require('connect-redis');
const { createClient } = require('redis');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'supersecretkey';
const REDIS_URL = process.env.REDIS_URL;

let redisClient;
let redisStore;

function buildSessionStore() {
  if (!REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set – falling back to in-memory session store (not recommended for production).');
    return undefined; // MemoryStore
  }

  redisClient = createClient({ url: REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis session client error:', err.message));

  // Connect asynchronously; failures will keep MemoryStore fallback from blocking startup
  redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis for sessions:', err.message);
  });

  redisStore = new RedisStore({ 
    client: redisClient, 
    prefix: 'sess:' 
  });
  return redisStore;
}

function setupSession(app) {
  const store = buildSessionStore();

  app.use(session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 4 // 4 hours
    }
  }));
}

function requireAdminLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin-login');
}

function handleAdminLogin(req, res) {
  const { username, password } = req.body;
  if (username === ADMIN_USER && bcrypt.compareSync(password, ADMIN_PASS_HASH)) {
    req.session.isAdmin = true;
    return res.redirect('/admin.html');
  }
  res.status(401).send('Invalid credentials');
}

function handleAdminLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin-login');
  });
}

module.exports = { setupSession, requireAdminLogin, handleAdminLogin, handleAdminLogout };

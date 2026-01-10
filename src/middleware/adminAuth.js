// Secure admin authentication middleware using express-session and bcrypt
const session = require('express-session');
const bcrypt = require('bcrypt');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || '';

function setupSession(app) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
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

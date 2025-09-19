// middleware/auth.js
exports.authenticateToken = (req, res, next) => {
  // Session-baserad auth
  const user = req.session && req.session.user;
  if (user) {
    req.user = user;
    return next();
  }
  // Rendera login on html request
  if (req.accepts('html')) {
    return res.status(401).render('login', {
      title: 'Login',
      errors: ['Please log in to continue.'],
      errorMessage: null,
      values: {}
    });
  }
  // Fallback for API
  return res.status(401).json({ error: 'Not authenticated' });
};

exports.ensureLoggedIn = exports.authenticateToken;

exports.ensureAdmin = (req, res, next) => {
  const user = req.session && req.session.user;
  if (user && user.is_admin) {
    req.user = user;
    return next();
  }
  if (req.accepts('html')) {
    return res.status(403).render('error', { message: 'Forbidden' });
  }
  return res.status(403).json({ error: 'Forbidden' });
};
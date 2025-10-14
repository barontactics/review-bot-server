/**
 * Authentication Middleware
 * Checks if user is logged in by verifying session
 */
const requireAuth = (req, res, next) => {
  console.log(req.session, req.session.userId)
  // Check if user ID exists in session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
  }

  // User is authenticated, proceed to next middleware
  next();
};

/**
 * Optional Authentication Middleware
 * Doesn't block the request, but sets req.isAuthenticated flag
 */
const checkAuth = (req, res, next) => {
  req.isAuthenticated = !!(req.session && req.session.userId);
  req.userId = req.session?.userId || null;
  next();
};

module.exports = {
  requireAuth,
  checkAuth,
};

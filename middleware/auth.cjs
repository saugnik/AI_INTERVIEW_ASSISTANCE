// middleware/auth.js
// Middleware to require authentication
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
}
// Middleware to require admin role
function requireAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
}
// Middleware to require user role (non-admin)
function requireUser(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'user') {
        return next();
    }
    res.status(403).json({ error: 'User access required' });
}
// Optional auth - attaches user if authenticated
function optionalAuth(req, res, next) {
    next();
}
module.exports = {
    requireAuth,
    requireAdmin,
    requireUser,
    optionalAuth
};

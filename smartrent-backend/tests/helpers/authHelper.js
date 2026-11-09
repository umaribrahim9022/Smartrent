const jwt = require('jsonwebtoken');

/**
 * Generates a valid JWT the same way authService does, so it passes
 * authMiddleware.protect() during tests.
 */
function generateToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'my_super_secret_jwt_key',
    { expiresIn: '7d' }
  );
}

module.exports = { generateToken };

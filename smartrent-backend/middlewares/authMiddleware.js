const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/index');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized to access this route, no token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      res.status(401);
      throw new Error('The user belonging to this token no longer exists');
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for Role-based Access Control (e.g., only owners can add properties)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('You do not have permission to perform this action'));
    }
    next();
  };
};
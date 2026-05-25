import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Verify Access Token
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header or query parameter (for EventSource support)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token: "Bearer TOKEN_VALUE"
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123456789_ca_office');

      // Get user from DB, attach to request object (excluding password) and populate role with its permissions
      req.user = await User.findById(decoded.id).populate({
        path: 'role',
        populate: {
          path: 'permissions',
        },
      });

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Authorize roles - RBAC check
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const roleName = req.user.role.name;
    if (!roles.includes(roleName)) {
      return res.status(403).json({
        success: false,
        message: `Role [${roleName}] is not authorized to access this resource`,
      });
    }

    next();
  };
};

// Authorize permissions - fine-grained check
export const authorizePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const hasPermission = req.user.role.permissions.some(
      (perm) => perm.name === permissionName
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Permission [${permissionName}] is required to access this resource`,
      });
    }

    next();
  };
};

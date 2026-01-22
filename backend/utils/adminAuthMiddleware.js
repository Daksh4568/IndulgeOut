const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Admin Authentication Middleware
 * Verifies that the user is authenticated and has admin role
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. Admin authentication required.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user and check if admin
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found. Please login again.' 
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        userRole: user.role
      });
    }

    // Attach user and admin profile to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      adminProfile: user.adminProfile
    };
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

/**
 * Permission Check Middleware
 * Verifies that admin has specific permission
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    const adminProfile = req.user?.adminProfile;

    if (!adminProfile) {
      return res.status(403).json({ 
        message: 'Admin profile not found' 
      });
    }

    // Super admins have all permissions
    if (adminProfile.accessLevel === 'super_admin') {
      return next();
    }

    // Check if admin has specific permission
    if (!adminProfile.permissions || !adminProfile.permissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}`,
        yourPermissions: adminProfile.permissions
      });
    }

    next();
  };
};

module.exports = { adminAuthMiddleware, requirePermission };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies JWT sent in Authorization: Bearer <token>
const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized access: no token provided' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized access: invalid or expired token' });
      }
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized access: user not found' });
      }
      req.user = user; // full user doc (minus password)
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Auth middleware error', error: error.message });
  }
};

// Role guard factory, e.g. requireRole('admin'), requireRole('artist', 'admin')
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role permissions' });
    }
    next();
  };
};

module.exports = { verifyJWT, requireRole };

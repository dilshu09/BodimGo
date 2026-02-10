import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-passwordHash');
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(`[AUTH DEBUG] User: ${req.user.email}, Role: ${req.user.role}, Required: ${roles}`);
    if (!roles.includes(req.user.role)) {
      console.log(`[AUTH DEBUG] Access Denied for ${req.user.email}`);
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

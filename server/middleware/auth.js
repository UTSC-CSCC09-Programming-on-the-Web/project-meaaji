import jwt from 'jsonwebtoken';
import { dbHelpers } from '../database.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await dbHelpers.getUser(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check subscription status
export const requireSubscription = (req, res, next) => {
  if (req.user.subscription_status !== 'active') {
    return res.status(403).json({ 
      error: 'Active subscription required',
      subscriptionStatus: req.user.subscription_status 
    });
  }
  next();
};
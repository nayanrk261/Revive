import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'revive-secret-key-2026';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const isDemoHeader = req.headers['x-demo-mode'] === 'true' || req.query.demo === 'true';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {
      console.warn('[AUTH] Token verification failed:', err.message);
    }
  }

  // Demo mode fallback for unauthenticated requests when X-Demo-Mode header is set
  if (isDemoHeader || !authHeader) {
    req.user = null; // null user means demo mode -> filters accountId: null
    return next();
  }

  return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
};

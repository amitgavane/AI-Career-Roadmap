import { verifyToken } from '../utils/tokenUtils.js';
import User from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Protect routes by requiring a valid JWT Bearer token
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(
        res,
        'Access denied. No authentication token provided.',
        401
      );
    }

    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      return sendError(
        res,
        'Access denied. Invalid authentication token format.',
        401
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Authentication token has expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid authentication token.', 401);
    }

    // Load user from database (omit passwordHash)
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return sendError(
        res,
        'User associated with this token no longer exists.',
        401
      );
    }

    if (!user.isActive) {
      return sendError(
        res,
        'User account is deactivated. Please contact support.',
        403
      );
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return sendError(res, 'Authentication failed.', 500);
  }
};

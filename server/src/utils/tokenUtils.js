import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token
 * @param {Object} payload - User identification payload (e.g. id, email, role)
 * @param {string} [expiresIn] - Optional custom expiration duration
 * @returns {string} Signed JWT token string
 */
export const generateToken = (payload, expiresIn) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const duration = expiresIn || process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: duration });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - Bearer JWT token string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret);
};

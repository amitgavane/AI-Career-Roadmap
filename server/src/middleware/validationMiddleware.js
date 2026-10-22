import { sendError } from '../utils/apiResponse.js';

// Basic email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate user registration request body
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Full name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (name.trim().length > 100) {
    errors.name = 'Name cannot exceed 100 characters';
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'Validation failed. Please correct the highlighted fields.', 400, errors);
  }

  // Sanitize email and name
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Validate user login request body
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(email.trim().toLowerCase())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'Validation failed. Email and password are required.', 400, errors);
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

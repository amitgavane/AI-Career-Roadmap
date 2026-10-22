import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { generateToken } from '../utils/tokenUtils.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Register a new student user and create their initial student profile
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', 409, {
        email: 'Email is already registered',
      });
    }

    // Hash password securely with bcrypt
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user record
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'student',
    });

    // Automatically initialize an associated StudentProfile
    await StudentProfile.create({
      userId: user._id,
      headline: 'Student / Aspiring Software Engineer',
    });

    // Generate JWT
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Return safe user information (never return passwordHash)
    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      'Student registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by normalized email
    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether email or password was wrong
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is inactive. Please contact support.', 403);
    }

    // Compare passwords securely
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Generate JWT
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Return safe user details
    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user & profile summary
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is loaded by requireAuth middleware without passwordHash
    const profile = await StudentProfile.findOne({ userId: req.user._id }).populate(
      'targetRoleId',
      'title slug department industryDemand'
    );

    return sendSuccess(
      res,
      {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          avatarUrl: req.user.avatarUrl,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt,
        },
        profile: profile || null,
      },
      'Current user information retrieved successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current session
 * @route   POST /api/auth/logout
 * @access  Private (Protected by JWT)
 */
export const logout = async (req, res) => {
  return sendSuccess(res, {}, 'Logged out successfully', 200);
};

import crypto from 'crypto';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Session from '../models/Session.js';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '../services/emailService.js';
import AuditLog from '../models/AuditLog.js';

// Helper to generate access token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey123456789_ca_office', {
    expiresIn: '15m', // short-lived access token
  });
};

// Helper to generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'superrefreshkey987654321_ca_office', {
    expiresIn: '7d', // longer-lived refresh token
  });
};

// Helper to save a session in the database
const createSession = async (userId, refreshToken, req) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return await Session.create({
    user: userId,
    refreshToken,
    userAgent: req.headers['user-agent'] || 'unknown',
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    expiresAt,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Default registration creates a Client role if not specified
    const roleName = role || 'Client';
    const roleDoc = await Role.findOne({ name: roleName });
    if (!roleDoc) {
      return res.status(400).json({ success: false, message: `Role ${roleName} does not exist` });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: roleDoc._id,
    });

    if (user) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Create session
      await createSession(user._id, refreshToken, req);

      // Set refresh token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Populate user role and permissions for response
      const populatedUser = await User.findById(user._id).populate({
        path: 'role',
        populate: { path: 'permissions' },
      });

      res.status(201).json({
        success: true,
        data: {
          _id: populatedUser._id,
          name: populatedUser.name,
          email: populatedUser.email,
          role: populatedUser.role,
          token: accessToken,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Explicitly select password and populate role permissions
    const user = await User.findOne({ email }).select('+password').populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    if (user && (await user.comparePassword(password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Create session
      await createSession(user._id, refreshToken, req);

      // Log login success
      await AuditLog.create({
        user: user._id,
        action: 'Login Success',
        details: `User ${user.name} logged in successfully`,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      // Set cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: accessToken,
        },
      });
    } else {
      // Log login failure
      const testUser = await User.findOne({ email });
      await AuditLog.create({
        user: testUser ? testUser._id : null,
        action: 'Login Fail',
        details: `Failed login attempt for email: ${email}`,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshUserToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'superrefreshkey987654321_ca_office');

    // Find valid session in database
    const session = await Session.findOne({
      refreshToken,
      user: decoded.id,
      isValid: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return res.status(401).json({ success: false, message: 'Session expired or invalid' });
    }

    // Generate new access and refresh tokens (rotation)
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    // Update current session
    session.refreshToken = newRefreshToken;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    session.expiresAt = expiresAt;
    await session.save();

    // Set new cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    // req.user is already populated by protect middleware
    if (req.user) {
      res.json({
        success: true,
        data: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    if (refreshToken) {
      // Invalidate session in DB
      const session = await Session.findOneAndUpdate({ refreshToken }, { isValid: false });
      if (session) {
        // Log logout
        await AuditLog.create({
          user: session.user,
          action: 'Logout',
          details: 'User logged out',
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        });
      }
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initiate password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    // Generate secure temporary token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and save in User document
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 10 minutes
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset URL targeting the frontend application
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const clientResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, clientResetUrl);

      res.json({ success: true, message: 'Password reset link sent to your email.' });
    } catch (err) {
      console.error('Mail error:', err.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  // Hash the token parameter to compare with database entry
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

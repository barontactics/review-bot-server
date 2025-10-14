const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const { requireAuth } = require('../middleware/auth');
const UserRepository = require('../repositories/UserRepository');

/**
 * POST /login
 * Authenticate a user with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
      });
    }

    // Authenticate user
    const user = await UserRepository.authenticate(email, password);

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Store user ID in session
    req.session.userId = user.id;

    res.json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login',
    });
  }
});

/**
 * POST /signup
 * Create a new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists',
      });
    }

    // Create new user (password will be auto-hashed)
    const newUser = await UserRepository.createUser({
      email,
      password,
    });

    // Store user ID in session (auto-login after signup)
    req.session.userId = newUser.id;

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during signup',
    });
  }
});

/**
 * Google OAuth Routes
 */

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/success`);
  }
);

/**
 * Discord OAuth Routes
 */

// Initiate Discord OAuth
router.get(
  '/discord',
  passport.authenticate('discord')
);

// Discord OAuth callback
router.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/success`);
  }
);

/**
 * Get current authenticated user
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    // User is already attached by passport deserialize
    if (req.user) {
      const { password, ...userWithoutPassword } = req.user;
      return res.json({
        success: true,
        data: userWithoutPassword,
      });
    }

    res.status(401).json({
      error: 'Not authenticated',
      message: 'You must be logged in to access this resource',
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching user data',
    });
  }
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout',
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Session destruction failed',
          message: 'An error occurred while destroying session',
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });
});

module.exports = router;

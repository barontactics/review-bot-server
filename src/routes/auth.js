const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const { requireAuth } = require('../middleware/auth');

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

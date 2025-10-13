const express = require('express');
const router = express.Router();
const UserRepository = require('../repositories/UserRepository');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /user/:id
 * Fetch a user by ID
 * Requires authentication
 */
router.get('/user/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid UUID',
      });
    }

    // Find user
    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID ${userId}`,
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching the user',
    });
  }
});

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

    // Create new user (password will be auto-hashed by UserSubscriber)
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

module.exports = router;

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

module.exports = router;

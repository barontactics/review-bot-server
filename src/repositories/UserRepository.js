const { AppDataSource } = require('../../config/database');
const { comparePassword } = require('../utils/password');

/**
 * User Repository
 * Provides methods for user-related database operations
 */
class UserRepository {
  constructor() {
    this.repository = null;
  }

  /**
   * Initialize repository (call after DataSource is initialized)
   */
  initialize() {
    if (!AppDataSource.isInitialized) {
      throw new Error('DataSource is not initialized');
    }
    this.repository = AppDataSource.getRepository('User');
    return this;
  }

  /**
   * Create a new user (password will be automatically hashed by UserSubscriber)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  async findById(id) {
    return await this.repository.findOneBy({ id });
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    return await this.repository.findOneBy({ email });
  }


  /**
   * Find user by Google ID
   * @param {string} googleId - Google OAuth ID
   * @returns {Promise<Object|null>} User or null
   */
  async findByGoogleId(googleId) {
    return await this.repository.findOneBy({ googleId });
  }

  /**
   * Find user by Discord ID
   * @param {string} discordId - Discord OAuth ID
   * @returns {Promise<Object|null>} User or null
   */
  async findByDiscordId(discordId) {
    return await this.repository.findOneBy({ discordId });
  }

  /**
   * Authenticate user by email and password
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User if authenticated, null otherwise
   */
  async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    // OAuth users don't have passwords
    if (!user.password) {
      return null;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return null;
    }

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updateData) {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteUser(id) {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  /**
   * Get all users
   * @returns {Promise<Array>} List of users
   */
  async findAll() {
    return await this.repository.find({
      select: ['id', 'email', 'googleId', 'discordId', 'authProvider', 'createdAt', 'updatedAt'],
    });
  }
}

module.exports = new UserRepository();

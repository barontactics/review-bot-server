/**
 * Example usage of UserRepository
 * This file demonstrates how to work with users in the application
 */

require('dotenv').config();
require('reflect-metadata');
const { AppDataSource } = require('../config/database');
const UserRepository = require('../src/repositories/UserRepository');

async function examples() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connected\n');

    // Initialize repository
    UserRepository.initialize();

    // Example 1: Create a new user
    console.log('=== Creating a new user ===');
    const newUser = await UserRepository.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'mypassword123', // Will be automatically hashed
    });
    console.log('User created:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    });
    console.log('Password is hashed:', newUser.password.startsWith('$2b$'));
    console.log();

    // Example 2: Authenticate user
    console.log('=== Authenticating user ===');
    const authenticatedUser = await UserRepository.authenticate(
      'test@example.com',
      'mypassword123'
    );
    if (authenticatedUser) {
      console.log('Authentication successful!');
      console.log('User data:', authenticatedUser);
    } else {
      console.log('Authentication failed');
    }
    console.log();

    // Example 3: Try wrong password
    console.log('=== Testing wrong password ===');
    const failedAuth = await UserRepository.authenticate(
      'test@example.com',
      'wrongpassword'
    );
    console.log('Authentication result:', failedAuth ? 'Success' : 'Failed (as expected)');
    console.log();

    // Example 4: Find user by email
    console.log('=== Finding user by email ===');
    const foundUser = await UserRepository.findByEmail('test@example.com');
    console.log('Found user:', foundUser ? foundUser.username : 'Not found');
    console.log();

    // Example 5: Update user
    console.log('=== Updating user ===');
    const updatedUser = await UserRepository.updateUser(newUser.id, {
      username: 'updateduser',
    });
    console.log('Updated username:', updatedUser.username);
    console.log();

    // Example 6: Get all users
    console.log('=== Getting all users ===');
    const allUsers = await UserRepository.findAll();
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((user) => {
      console.log(`- ${user.username} (${user.email})`);
    });
    console.log();

    // Example 7: Delete user
    console.log('=== Deleting user ===');
    const deleted = await UserRepository.deleteUser(newUser.id);
    console.log('User deleted:', deleted);
    console.log();

    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close database connection
    await AppDataSource.destroy();
    console.log('\nDatabase connection closed');
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  examples();
}

module.exports = examples;

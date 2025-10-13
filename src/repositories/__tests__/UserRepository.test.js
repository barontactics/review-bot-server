const UserRepository = require('../UserRepository');
const { comparePassword } = require('../../utils/password');

// Mock the database module
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

// Mock password utilities
jest.mock('../../utils/password', () => ({
  comparePassword: jest.fn(),
}));

const { AppDataSource } = require('../../../config/database');

describe('UserRepository', () => {
  let mockRepository;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock repository with all methods
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    // Setup AppDataSource mock
    AppDataSource.getRepository.mockReturnValue(mockRepository);

    // Re-initialize the repository to use the mock
    UserRepository.repository = null;
    UserRepository.initialize();
  });

  describe('initialize', () => {
    it('should initialize the repository', () => {
      expect(AppDataSource.getRepository).toHaveBeenCalledWith('User');
      expect(UserRepository.repository).toBe(mockRepository);
    });

    it('should throw error if DataSource is not initialized', () => {
      AppDataSource.isInitialized = false;
      UserRepository.repository = null;

      expect(() => UserRepository.initialize()).toThrow('DataSource is not initialized');

      AppDataSource.isInitialized = true; // Reset for other tests
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const createdUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await UserRepository.createUser(userData);

      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });

    it('should create a user with OAuth provider', async () => {
      const userData = {
        email: 'test@example.com',
        googleId: '1234567890',
        authProvider: 'google',
      };

      const createdUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await UserRepository.createUser(userData);

      expect(result.googleId).toBe('1234567890');
      expect(result.authProvider).toBe('google');
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = {
        id: userId,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await UserRepository.findById(userId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await UserRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await UserRepository.findByEmail(email);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await UserRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should find a user by Google ID', async () => {
      const googleId = '1234567890';
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        googleId,
        authProvider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await UserRepository.findByGoogleId(googleId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ googleId });
      expect(result).toEqual(user);
    });
  });

  describe('findByDiscordId', () => {
    it('should find a user by Discord ID', async () => {
      const discordId = '9876543210';
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        discordId,
        authProvider: 'discord',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await UserRepository.findByDiscordId(discordId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ discordId });
      expect(result).toEqual(user);
    });
  });

  describe('authenticate', () => {
    it('should authenticate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(user);
      comparePassword.mockResolvedValue(true);

      const result = await UserRepository.authenticate(email, password);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(comparePassword).toHaveBeenCalledWith(password, 'hashed_password');
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      expect(result.password).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await UserRepository.authenticate('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockRepository.findOneBy.mockResolvedValue(user);
      comparePassword.mockResolvedValue(false);

      const result = await UserRepository.authenticate('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null for OAuth users without password', async () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password: null,
        googleId: '1234567890',
        authProvider: 'google',
      };

      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await UserRepository.authenticate('test@example.com', 'password');

      expect(result).toBeNull();
      expect(comparePassword).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        email: 'new@example.com',
      };

      const updatedUser = {
        id: userId,
        email: 'new@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOneBy.mockResolvedValue(updatedUser);

      const result = await UserRepository.updateUser(userId, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(result.email).toBe('new@example.com');
    });

    it('should return null if user not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await UserRepository.updateUser('non-existent-id', { email: 'new@example.com' });

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await UserRepository.deleteUser(userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await UserRepository.deleteUser('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const users = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user1@example.com',
          googleId: null,
          discordId: null,
          authProvider: 'local',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'user2@example.com',
          googleId: null,
          discordId: null,
          authProvider: 'local',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(users);

      const result = await UserRepository.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['id', 'email', 'googleId', 'discordId', 'authProvider', 'createdAt', 'updatedAt'],
      });
      expect(result).toHaveLength(2);
      expect(result[0].password).toBeUndefined();
      expect(result[1].password).toBeUndefined();
    });

    it('should return empty array if no users found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await UserRepository.findAll();

      expect(result).toEqual([]);
    });
  });
});

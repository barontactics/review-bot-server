const VideoRepository = require('../VideoRepository');

// Mock the database module
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

const { AppDataSource } = require('../../../config/database');

describe('VideoRepository', () => {
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
    };

    // Setup AppDataSource mock
    AppDataSource.getRepository.mockReturnValue(mockRepository);

    // Re-initialize the repository to use the mock
    VideoRepository.repository = null;
    VideoRepository.initialize();
  });

  describe('initialize', () => {
    it('should initialize the repository', () => {
      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
      expect(VideoRepository.repository).toBe(mockRepository);
    });

    it('should throw error if DataSource is not initialized', () => {
      AppDataSource.isInitialized = false;
      VideoRepository.repository = null;

      expect(() => VideoRepository.initialize()).toThrow('DataSource is not initialized');

      AppDataSource.isInitialized = true; // Reset for other tests
    });
  });

  describe('createVideo', () => {
    it('should create a new video successfully', async () => {
      const videoData = {
        title: 'Test Video',
        description: 'A test video',
        url: 'https://storage.googleapis.com/bucket/user-id/video.mp4',
        fileSize: 5242880,
        mimeType: 'video/mp4',
        status: 'completed',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const createdVideo = {
        id: '650e8400-e29b-41d4-a716-446655440001',
        ...videoData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdVideo);
      mockRepository.save.mockResolvedValue(createdVideo);

      const result = await VideoRepository.createVideo(videoData);

      expect(mockRepository.create).toHaveBeenCalledWith(videoData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdVideo);
      expect(result).toEqual(createdVideo);
    });

    it('should create a video with minimal data', async () => {
      const videoData = {
        title: 'Test Video',
        url: 'https://storage.googleapis.com/bucket/user-id/video.mp4',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const createdVideo = {
        id: '650e8400-e29b-41d4-a716-446655440001',
        ...videoData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(createdVideo);
      mockRepository.save.mockResolvedValue(createdVideo);

      const result = await VideoRepository.createVideo(videoData);

      expect(result.title).toBe('Test Video');
      expect(result.url).toBe(videoData.url);
      expect(result.userId).toBe(videoData.userId);
    });
  });

  describe('findById', () => {
    it('should find a video by id', async () => {
      const videoId = '650e8400-e29b-41d4-a716-446655440001';
      const video = {
        id: videoId,
        title: 'Test Video',
        description: 'A test video',
        url: 'https://storage.googleapis.com/bucket/user-id/video.mp4',
        fileSize: 5242880,
        mimeType: 'video/mp4',
        status: 'completed',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(video);

      const result = await VideoRepository.findById(videoId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: videoId });
      expect(result).toEqual(video);
    });

    it('should return null if video not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await VideoRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithUser', () => {
    it('should find a video by id with user relation', async () => {
      const videoId = '650e8400-e29b-41d4-a716-446655440001';
      const video = {
        id: videoId,
        title: 'Test Video',
        url: 'https://storage.googleapis.com/bucket/user-id/video.mp4',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(video);

      const result = await VideoRepository.findByIdWithUser(videoId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: videoId },
        relations: ['user'],
      });
      expect(result).toEqual(video);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should return null if video not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await VideoRepository.findByIdWithUser('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all videos for a user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const videos = [
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          title: 'Video 1',
          url: 'https://storage.googleapis.com/bucket/user-id/video1.mp4',
          userId,
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
          updatedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440002',
          title: 'Video 2',
          url: 'https://storage.googleapis.com/bucket/user-id/video2.mp4',
          userId,
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      ];

      mockRepository.find.mockResolvedValue(videos);

      const result = await VideoRepository.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Video 1');
      expect(result[1].title).toBe('Video 2');
    });

    it('should return empty array if user has no videos', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await VideoRepository.findByUserId('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toEqual([]);
    });

    it('should order videos by creation date (newest first)', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      mockRepository.find.mockResolvedValue([]);

      await VideoRepository.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('updateVideo', () => {
    it('should update video successfully', async () => {
      const videoId = '650e8400-e29b-41d4-a716-446655440001';
      const existingVideo = {
        id: videoId,
        title: 'Old Title',
        description: 'Old description',
        url: 'https://storage.googleapis.com/bucket/user-id/video.mp4',
        status: 'pending',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        title: 'New Title',
        description: 'New description',
        status: 'completed',
      };

      const updatedVideo = {
        ...existingVideo,
        ...updateData,
        updatedAt: new Date(),
      };

      mockRepository.findOneBy.mockResolvedValue(existingVideo);
      mockRepository.save.mockResolvedValue(updatedVideo);

      const result = await VideoRepository.updateVideo(videoId, updateData);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: videoId });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingVideo,
        ...updateData,
      });
      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New description');
      expect(result.status).toBe('completed');
    });

    it('should return null if video not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await VideoRepository.updateVideo('non-existent-id', { title: 'New Title' });

      expect(result).toBeNull();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should update only specified fields', async () => {
      const videoId = '650e8400-e29b-41d4-a716-446655440001';
      const existingVideo = {
        id: videoId,
        title: 'Old Title',
        description: 'Old description',
        url: 'https://storage.googleapis.com/bucket/user-id/video.mp4',
        status: 'completed',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const updateData = {
        title: 'New Title',
      };

      mockRepository.findOneBy.mockResolvedValue(existingVideo);
      mockRepository.save.mockResolvedValue({ ...existingVideo, ...updateData });

      const result = await VideoRepository.updateVideo(videoId, updateData);

      expect(result.title).toBe('New Title');
      expect(result.description).toBe('Old description'); // Should remain unchanged
    });
  });

  describe('deleteVideo', () => {
    it('should delete video successfully', async () => {
      const videoId = '650e8400-e29b-41d4-a716-446655440001';
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await VideoRepository.deleteVideo(videoId);

      expect(mockRepository.delete).toHaveBeenCalledWith(videoId);
      expect(result).toBe(true);
    });

    it('should return false if video not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await VideoRepository.deleteVideo('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all videos ordered by creation date', async () => {
      const videos = [
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          title: 'Video 1',
          url: 'https://storage.googleapis.com/bucket/user1/video1.mp4',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
          updatedAt: new Date('2024-01-15T10:30:00.000Z'),
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440002',
          title: 'Video 2',
          url: 'https://storage.googleapis.com/bucket/user2/video2.mp4',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      ];

      mockRepository.find.mockResolvedValue(videos);

      const result = await VideoRepository.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Video 1');
      expect(result[1].title).toBe('Video 2');
    });

    it('should return empty array if no videos found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await VideoRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle repository not initialized in createVideo', async () => {
      VideoRepository.repository = null;
      AppDataSource.isInitialized = true;

      const videoData = {
        title: 'Test Video',
        url: 'https://storage.googleapis.com/bucket/user-id/video.mp4',
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      mockRepository.create.mockReturnValue(videoData);
      mockRepository.save.mockResolvedValue(videoData);

      await VideoRepository.createVideo(videoData);

      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
    });

    it('should handle repository not initialized in findById', async () => {
      VideoRepository.repository = null;
      AppDataSource.isInitialized = true;
      const videoId = '650e8400-e29b-41d4-a716-446655440001';

      mockRepository.findOneBy.mockResolvedValue(null);

      await VideoRepository.findById(videoId);

      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: videoId });
    });

    it('should handle repository not initialized in findByIdWithUser', async () => {
      VideoRepository.repository = null;
      AppDataSource.isInitialized = true;
      const videoId = '650e8400-e29b-41d4-a716-446655440001';

      mockRepository.findOne.mockResolvedValue(null);

      await VideoRepository.findByIdWithUser(videoId);

      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: videoId },
        relations: ['user'],
      });
    });

    it('should handle repository not initialized in findByUserId', async () => {
      VideoRepository.repository = null;
      AppDataSource.isInitialized = true;
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      mockRepository.find.mockResolvedValue([]);

      await VideoRepository.findByUserId(userId);

      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle repository not initialized in updateVideo', async () => {
      VideoRepository.repository = null;
      AppDataSource.isInitialized = true;
      const videoId = '650e8400-e29b-41d4-a716-446655440001';

      mockRepository.findOneBy.mockResolvedValue(null);

      await VideoRepository.updateVideo(videoId, { title: 'Updated' });

      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
    });

    it('should handle repository not initialized in deleteVideo', async () => {
      VideoRepository.repository = null;
      AppDataSource.isInitialized = true;
      const videoId = '650e8400-e29b-41d4-a716-446655440001';

      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await VideoRepository.deleteVideo(videoId);

      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
      expect(mockRepository.delete).toHaveBeenCalledWith(videoId);
    });

    it('should handle repository not initialized in findAll', async () => {
      VideoRepository.repository = null;
      AppDataSource.isInitialized = true;

      mockRepository.find.mockResolvedValue([]);

      await VideoRepository.findAll();

      expect(AppDataSource.getRepository).toHaveBeenCalledWith('Video');
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection error');
      mockRepository.findOneBy.mockRejectedValue(error);

      await expect(VideoRepository.findById('some-id')).rejects.toThrow('Database connection error');
    });
  });
});

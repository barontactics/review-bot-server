const { AppDataSource } = require('../../config/database');

class VideoRepository {
  constructor() {
    this.repository = null;
  }

  initialize() {
    if (!AppDataSource.isInitialized) {
      throw new Error('DataSource is not initialized');
    }
    this.repository = AppDataSource.getRepository('Video');
  }

  async createVideo(videoData) {
    if (!this.repository) {
      this.initialize();
    }

    const video = this.repository.create(videoData);
    return await this.repository.save(video);
  }

  async findById(id) {
    if (!this.repository) {
      this.initialize();
    }

    return await this.repository.findOneBy({ id });
  }

  async findByIdWithUser(id) {
    if (!this.repository) {
      this.initialize();
    }

    return await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId) {
    if (!this.repository) {
      this.initialize();
    }

    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateVideo(id, updateData) {
    if (!this.repository) {
      this.initialize();
    }

    const video = await this.findById(id);
    if (!video) {
      return null;
    }

    Object.assign(video, updateData);
    return await this.repository.save(video);
  }

  async deleteVideo(id) {
    if (!this.repository) {
      this.initialize();
    }

    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async findAll() {
    if (!this.repository) {
      this.initialize();
    }

    return await this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }
}

module.exports = new VideoRepository();

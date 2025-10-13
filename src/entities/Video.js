const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Video',
  tableName: 'videos',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    title: {
      type: String,
      nullable: false,
    },
    description: {
      type: String,
      nullable: true,
    },
    url: {
      type: String,
      nullable: false,
    },
    thumbnailUrl: {
      type: String,
      nullable: true,
    },
    duration: {
      type: Number,
      nullable: true,
      comment: 'Duration in seconds',
    },
    fileSize: {
      type: Number,
      nullable: true,
      comment: 'File size in bytes',
    },
    mimeType: {
      type: String,
      nullable: true,
    },
    status: {
      type: String,
      default: 'pending',
      comment: 'pending, processing, completed, failed',
    },
    userId: {
      type: 'uuid',
      nullable: false,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'userId',
      },
      onDelete: 'CASCADE',
    },
  },
});

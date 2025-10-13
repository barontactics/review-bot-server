const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    email: {
      type: String,
      unique: true,
      nullable: false,
    },
    password: {
      type: String,
      nullable: true, // Nullable for OAuth users
    },
    googleId: {
      type: String,
      nullable: true,
      unique: true,
    },
    discordId: {
      type: String,
      nullable: true,
      unique: true,
    },
    authProvider: {
      type: String,
      nullable: false,
      default: 'local',
      comment: 'local, google, discord',
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
});

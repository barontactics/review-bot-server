const { DataSource } = require('typeorm');
require('dotenv').config();
const UserSubscriber = require('../src/subscribers/UserSubscriber');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'review_bot',
  synchronize: process.env.NODE_ENV === 'development', // Auto-sync in dev only
  logging: process.env.NODE_ENV === 'development',
  entities: ['src/entities/**/*.js'],
  migrations: ['src/migrations/**/*.js'],
  subscribers: [UserSubscriber],
});

module.exports = { AppDataSource };

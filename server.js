require('dotenv').config();
require('reflect-metadata');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('./config/passport');
const { AppDataSource } = require('./config/database');
const UserRepository = require('./src/repositories/UserRepository');
const VideoRepository = require('./src/repositories/VideoRepository');
const userRoutes = require('./src/routes/users');
const authRoutes = require('./src/routes/auth');
const videoRoutes = require('./src/routes/videos');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport initialization (must be after session)
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the server!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    // Initialize repositories
    UserRepository.initialize();
    VideoRepository.initialize();
    console.log('Repositories initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during server initialization:', error);
    process.exit(1);
  }
};

startServer();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const { AppDataSource } = require('./database');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const userRepository = AppDataSource.getRepository('User');
    const user = await userRepository.findOneBy({ id });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.CALLBACK_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const userRepository = AppDataSource.getRepository('User');

          // Check if user already exists with this Google ID
          let user = await userRepository.findOneBy({ googleId: profile.id });

          if (user) {
            // User exists, return user
            return done(null, user);
          }

          // Check if user exists with this email
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          if (email) {
            user = await userRepository.findOneBy({ email });

            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user = await userRepository.save(user);
              return done(null, user);
            }
          }

          // Create new user
          if (!email) {
            return done(new Error('No email provided by Google'), null);
          }

          const newUser = userRepository.create({
            email,
            googleId: profile.id,
            authProvider: 'google',
          });

          user = await userRepository.save(newUser);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// Discord OAuth Strategy
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: `${process.env.CALLBACK_URL || 'http://localhost:3000'}/api/auth/discord/callback`,
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const userRepository = AppDataSource.getRepository('User');

          // Check if user already exists with this Discord ID
          let user = await userRepository.findOneBy({ discordId: profile.id });

          if (user) {
            // User exists, return user
            return done(null, user);
          }

          // Check if user exists with this email
          const email = profile.email;

          if (email) {
            user = await userRepository.findOneBy({ email });

            if (user) {
              // Link Discord account to existing user
              user.discordId = profile.id;
              user = await userRepository.save(user);
              return done(null, user);
            }
          }

          // Create new user
          if (!email) {
            return done(new Error('No email provided by Discord'), null);
          }

          const newUser = userRepository.create({
            email,
            discordId: profile.id,
            authProvider: 'discord',
          });

          user = await userRepository.save(newUser);
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;

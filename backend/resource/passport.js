const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../modal/user');
const passport=require('passport')
const dotenv=require('dotenv').config()

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id.id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.googleId,
  clientSecret: process.env.googleSecret,
  callbackURL: 'http://localhost:4000/api/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({ googleId: profile.id }).then(existingUser => {
    if (existingUser) {
      return done(null, existingUser);
    } else {
      new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        photo: profile.photos[0].value
      }).save().then(user => done(null, user));
    }
  });
}));

module.exports = passport;

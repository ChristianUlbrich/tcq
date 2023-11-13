import passport from 'passport';
import ghs from './ghstrategy.js';

passport.use(ghs);
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

export default passport;

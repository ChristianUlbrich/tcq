import passport from 'passport';
import ghs from './ghstrategy.js';

passport.use(ghs);
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));

export default passport;

import User from './userSchema.js'

export function registerSerial(passport) {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        User.findById(user._id, (err, user) => {
            if (err) return done(err);
            if (user) {
                return done(null, user);
            }
            else {
                return done(err);
            }
        })
    });
}
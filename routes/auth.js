import express from "express";
import passport from "passport";
import GoogleStrategy from 'passport-google-oidc';
import * as dotenv from 'dotenv';
import Mongoose from 'mongoose';
import User from '../userSchema.js'
import { registerSerial } from '../serializing.js'
dotenv.config();


// Authentication Code
await Mongoose.connect(process.env.MONGO_URL);
const router = express.Router();
export const strategy = new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/login/oauth2/redirect/google',
    scope: ['email', 'profile']
}, async function verify(issuer, profile, cb) {
    try {
        registerSerial(passport);
        const existingUser = await User.findOne({ 'id': profile.id }).exec();
        if (existingUser) {
            return cb(null, existingUser);
        }
        else {
            console.log('Creating new user...');
            const newUser = new User({
                id: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value
            });
            await newUser.save();
            return cb(null, newUser);
        }
    }
    catch (err) {
        console.log(err);
    }
});
export const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        res.redirect('/login')
    }
}


// Routing Code
router.get('/', (req, res) => {
    res.sendFile('public/login/login.html', { root: '.' });
})
router.get('/auth/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate
    ('google', { failureRedirect: '/login', failureMessage: true }),
    (req, res) => {
        res.redirect('/login/success');
    });

router.get('/success', (req, res) => {
    res.redirect('/home');
});


export default router;
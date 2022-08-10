import express from "express";
import passport from "passport";
import crypto from 'crypto';
import LocalStrategy from 'passport-local';
import * as dotenv from 'dotenv';
import Mongoose from 'mongoose';
import User from '../userSchema.js'
import { registerSerial } from '../serializing.js'
dotenv.config();


// Authentication Code
await Mongoose.connect(process.env.MONGO_URL);
const router = express.Router();
export const strategy = new LocalStrategy(async function verify(email, password, cb) {
    try {
        //registerSerial(passport);
        console.log('aageaegaeg')
        const existingUser = await User.findOne({ 'email': email }).exec();
        if (!existingUser) {
            console.log('here!!!')
            return cb(null, false, { message: "Invalid email or password." });
        }
        else {
            console.log(existingUser)
            const givenHashedPass = crypto.pbkdf2Sync(password, existingUser.salt, 310000, 32, 'sha256').toString('hex');
            console.log(givenHashedPass);
            console.log(existingUser.hashed_password);
            if (!crypto.timingSafeEqual(existingUser.hashed_password, givenHashedPass)) {
                return cb(null, false, { message: 'Invalid email or password.' });
            }
            return cb(null, existingUser);
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

export function isAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    else {
        res.redirect('/login');
    }
}

export async function wrapperAuth(req, res, next) {
    console.log(req.originalUrl);
    if (req.session.user) {
        console.log('already logged');
        return res.redirect('/home');
    }
    const user = await authenticateUser(req);
    if (!user) {
        res.redirect('/login');
        console.log('redirect failed')
        // send failure message?
    }
    else {
        req.session.user = user;
        res.redirect('/home');
    }
}

async function authenticateUser(req) {
    try {
        //registerSerial(passport);
        const foundUser = await User.findOne({ 'email': req.body.email }).exec();
        if (!foundUser) {
            console.log('no user here!!!')
            return false;
        }
        else {
            console.log(foundUser)
            const givenHashedPass = crypto.pbkdf2Sync(req.body.password, foundUser.salt, 310000, 32, 'sha256').toString('hex');
            if (!crypto.timingSafeEqual(Buffer.from(foundUser.hashed_password), Buffer.from(givenHashedPass))) {
                console.log('password wrong')
                return false;
            }
            else {
                console.log('password right')
                return foundUser;
            }
        }
    }
    catch (err) {
        console.log(err);
    }
}


// Routing Code
router.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home');
    }
    res.sendFile('public/login/login.html', { root: '.' });
})
//router.get('/auth/google', passport.authenticate('local'));

/* router.post('/auth', passport.authenticate
    ('local', { successRedirect: '/success', failureRedirect: '/login', failureMessage: true })); */

router.post('/auth', wrapperAuth);


export default router;
import express from "express";
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import Mongoose from 'mongoose';
import User from '../userSchema.js'
dotenv.config();


// Authentication Code
await Mongoose.connect(process.env.MONGO_URL);
const router = express.Router();

export function isAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    else {
        res.redirect('/login');
    }
}

export async function wrapperAuth(req, res, next) {
    if (req.session.user) {
        return res.redirect('/home');
    }
    const user = await authenticateUser(req);
    if (!user) {
        res.redirect('/login');
        // send failure message?
    }
    else {
        req.session.user = user;
        res.redirect('/home');
    }
}

async function authenticateUser(req) {
    try {
        const foundUser = await User.findOne({ 'email': req.body.email }).exec();
        if (!foundUser) {
            return false;
        }
        else {
            const givenHashedPass = crypto.pbkdf2Sync(req.body.password, foundUser.salt, 310000, 32, 'sha256').toString('hex');
            if (!crypto.timingSafeEqual(Buffer.from(foundUser.hashed_password), Buffer.from(givenHashedPass))) {
                return false;
            }
            else {
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

router.post('/auth', wrapperAuth);

router.get('/signup', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home');
    }
    res.sendFile('public/signup/signup.html', { root: '.' });
})

router.post('/signup', async (req, res) => {
    const foundUser = await User.findOne({ 'email': req.body.email }).exec();
    if (foundUser) {
        return res.redirect('/login');
    }

    // remember to do email validation later!!!!
    const salt = crypto.randomBytes(16).toString('hex');
    const id = crypto.randomBytes(8).toString('hex');
    const hashedPass = crypto.pbkdf2Sync(req.body.password, salt, 310000, 32, 'sha256').toString('hex');
    const newUser = new User({
        id: id,
        username: req.body.username,
        email: req.body.email,
        hashed_password: hashedPass,
        salt: salt
    });
    await newUser.save();
    req.session.user = newUser;
    res.redirect('/home');
});


export default router;
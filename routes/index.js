import express from "express";
import * as auth from "./auth.js";

const router = express.Router();

router.get('/', auth.ensureAuthenticated, (req, res) => {
    res.redirect('/home');
})

router.get('/home', auth.ensureAuthenticated, (req, res) => {
    res.send('Home Page');
})

router.post('/logout', auth.ensureAuthenticated, (req, res, next) => {
    req.logOut((err) => {
        if (err) return next(err);
        res.redirect('/');
    })
})

export default router;
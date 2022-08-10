import express from "express";
import * as auth from "./auth.js";

const router = express.Router();

router.get('/', auth.isAuth, (req, res) => {
    res.redirect('/home');
})

router.get('/home', auth.isAuth, (req, res) => {
    console.log(req.session.user);
    res.send('Home Page');
})

router.post('/logout', auth.isAuth, (req, res, next) => {
    res.send('log out');
})

export default router;
import express from "express";
import * as auth from "./auth.js";

const router = express.Router();

router.get('/', auth.isAuth, (req, res) => {
    res.redirect('/home');
})

router.get('/home', auth.isAuth, (req, res) => {
    res.render('messages/messages.ejs');
})
router.get('/logout', auth.isAuth, (req, res) => {
    res.send('logadga')
})
router.post('/logout', auth.isAuth, (req, res, next) => {
})

export default router;
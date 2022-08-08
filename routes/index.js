import express from "express";
import * as auth from "./auth.js";

const router = express.Router();

router.get('/', auth.ensureAuthenticated, (req, res) => {
    res.redirect('/home');
})

router.get('/home', auth.ensureAuthenticated, (req, res) => {
    res.send('Homepage');
})

export default router;
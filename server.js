import express from 'express';
import fs from 'fs';
import { Server } from 'socket.io';
import http from 'http';
import loginRouter from './routes/auth.js';
import indexRouter from './routes/index.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { strategy } from './routes/auth.js';
import passport from 'passport';
import { registerSerial } from './serializing.js';
import { createHmac, timingSafeEqual } from 'crypto';
import * as dotenv from 'dotenv';
import bodyParser from 'body-parser';
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = 4105;

app.set('view engine', 'ejs');
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());
app.use(express.static('public'))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
}))
/* passport.use(strategy);
app.use(passport.initialize()); */
//app.use(passport.session());
//registerSerial(passport);

app.use('/', indexRouter);
app.get('/success', (req, res) => {
    res.send('Suc');
})
app.use('/login', loginRouter);

io.on('connection', (socket) => {
    console.log('Client connected!');
})

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

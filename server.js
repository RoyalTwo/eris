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
app.use(express.json());
app.use(express.static('public'))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
}))
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());
registerSerial(passport);

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/dev/push', bodyParser.json({
    verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding || 'utf8');
    }
}))


// unused push to prod updater
app.post('/dev/push', (req, res) => {
    const reqSig = req.headers['x-hub-signature-256'];
    const hmac = createHmac('sha256', process.env.GITHUB_PUSH_SECRET);
    hmac.update(JSON.stringify(req.body), 'utf8');
    const localSig = `sha256=${hmac.digest('hex')}`
    if (timingSafeEqual(Buffer.from(localSig), Buffer.from(reqSig))) {
        let ref = req.body.ref;
        ref = ref.split('/');
        if (ref[ref.length - 1] == 'prod') {
            console.log('prod from github');
        }
    }
})

io.on('connection', (socket) => {
    console.log('Client connected!');
})

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

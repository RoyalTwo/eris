import express from 'express';
import fs from 'fs';
import { Server } from 'socket.io';
import https from 'https';
import loginRouter from './routes/auth.js';
import indexRouter from './routes/index.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { strategy } from './routes/auth.js';
import passport from 'passport';
import { registerSerial } from './serializing.js';
import * as dotenv from 'dotenv';
dotenv.config();

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.cert')
}
const app = express();
const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer);
const PORT = 4105;

app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(session({
    secret: process.env.SECRET,
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

io.on('connection', (socket) => {
    console.log('Client connected!');
})

httpsServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})
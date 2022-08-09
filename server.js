import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import loginRouter from './routes/auth.js';
import indexRouter from './routes/index.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { strategy } from './routes/auth.js';
import passport from 'passport';
import { registerSerial } from './serializing.js';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
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

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

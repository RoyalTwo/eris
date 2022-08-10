import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import loginRouter from './routes/auth.js';
import indexRouter from './routes/index.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import * as dotenv from 'dotenv';
dotenv.config();

// NEED TO IMPLEMENT SECURITY

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

app.use('/', indexRouter);
app.use('/login', loginRouter);

io.on('connection', (socket) => {
    console.log('Client connected!');
})

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

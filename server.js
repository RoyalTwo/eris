import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import loginRouter from './routes/auth.js';
import indexRouter from './routes/index.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import User from './userSchema.js';
import Message from './messageSchema.js';
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

app.post('/newMessage', async (req, res) => {
    const msgSession = req.session.user;
    const msgRoom = req.body.room;
    const dbUser = await User.findOne({ 'username': msgSession.username, 'hashed_password': msgSession.hashed_password }).exec();
    if (dbUser) {
        // inefficient way to store messages; should store them IN rooms
        // so you don't need to search entire message db
        const dbMsg = new Message({ username: dbUser.username, message: req.body.msg, room: req.body.room });
        io.to(msgRoom).emit("dm_message", dbMsg);
        await dbMsg.save();
    }
})

app.post('/loadMessages', async (req, res) => {
    const messages = await Message.find({ room: req.body.room });
    res.send(messages);
})

io.on("connection", (socket) => {
    socket.on("change_dm", (newDm, oldDm) => {
        socket.leave(`${oldDm}`);
        socket.join(`${newDm}`);
    })
});

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

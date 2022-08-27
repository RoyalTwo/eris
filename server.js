import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import loginRouter from './routes/auth.js';
import indexRouter from './routes/index.js';
import infoRouter from './routes/infoapi.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import User from './userSchema.js';
import Message from './messageSchema.js';
import Room from './roomSchema.js';
import sharedsession from 'express-socket.io-session';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = 4105;
const expsession = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
});

app.set('view engine', 'ejs');
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());
app.use(express.static('public'))
app.use(expsession);

app.use('/', indexRouter);
app.use('/', infoRouter);
app.use('/login', loginRouter);

app.post('/newMessage', async (req, res) => {
    const msgSession = req.session.user;
    const msgRoom = req.body.room;
    const dbUser = await User.findOne({ 'username': msgSession.username, 'hashed_password': msgSession.hashed_password }).exec();
    if (dbUser) {
        // VERY inefficient way to store messages; should store them IN rooms
        // In fact, the whole database should be refactored
        const dbMsg = new Message({ username: dbUser.username, message: req.body.msg, room: req.body.room });
        io.to(msgRoom).emit("dm_message", dbMsg, dbUser.picURL);
        await dbMsg.save();
    }
})

io.use(sharedsession(expsession, {
    autoSave: true
}));

io.on("connection", async (socket) => {
    // initial setup of sid:
    let socketUser = socket.handshake.session.user
    await User.updateOne({ 'username': socketUser.username, 'hashed_password': socketUser.hashed_password }, { $set: { 'sid': socket.id } });
    socketUser.sid = socket.id;

    socket.on("change_dm", (newDm) => {
        socket.join(`${newDm}`);
    });

    socket.on("add_friend", async (toAdd) => {
        // might have to reset socketUser in this function first?
        if (toAdd == socketUser.username) return;
        const toAddUser = await User.findOne({ 'username': toAdd });
        if (toAddUser == null || !toAddUser) return; // should send error message
        const toAddSID = toAddUser.sid;
        io.to(toAddSID).emit("friend_request", socket.handshake.session.user);

    })
    socket.on("friend_response", async (recievedUser) => {
        if (!recievedUser) {
            console.log('request denied')
            return;
        }
        const sentUser = socket.handshake.session.user;
        await User.updateOne({ 'username': recievedUser.username, 'hashed_password': recievedUser.hashed_password }, { $addToSet: { dms: sentUser.username } }).exec();
        await User.updateOne({ 'username': sentUser.username, 'hashed_password': sentUser.hashed_password }, { $addToSet: { dms: recievedUser.username } });
        console.log('Added DM');
        io.to(recievedUser.sid).emit("update_dms");
        io.to(sentUser.sid).emit("update_dms");
    })
});

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

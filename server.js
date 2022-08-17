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
        // inefficient way to store messages; should store them IN rooms
        // so you don't need to search entire message db
        const dbMsg = new Message({ username: dbUser.username, message: req.body.msg, room: req.body.room });
        io.to(msgRoom).emit("dm_message", dbMsg, dbUser.picURL);
        await dbMsg.save();
    }
})

app.post('/addFriend', async (req, res) => {
    const session = req.session.user;
    const userToAdd = await User.findOne({ 'username': req.body.username });
    if (!userToAdd) return res.send(false);

    await User.updateOne({ 'username': session.username, 'hashed_password': session.hashed_password }, { $addToSet: { dms: req.body.username } }).exec();
    await User.updateOne({ 'username': req.body.username }, { $addToSet: { dms: session.username } });
    console.log('Added DM');
    return res.send(true);
})

io.use(sharedsession(expsession, {
    autoSave: true
}));

io.on("connection", async (socket) => {
    // refactor POST requests to use this instead!
    // initial setup of sid:
    let socketUser = socket.handshake.session.user
    await User.updateOne({ 'username': socketUser.username, 'hashed_password': socketUser.hashed_password }, { $set: { 'sid': socket.id } });
    socketUser.sid = socket.id;

    socket.on("change_dm", (newDm) => {
        socket.join(`${newDm}`);
    });

    socket.on("add_friend", async (toAdd) => {
        // fix flashing on loading dms
        const toAddUser = await User.findOne({ 'username': toAdd });
        if (toAddUser == null) return;
        const toAddSID = toAddUser.sid;
        io.to(toAddSID).emit("update_dms");
        io.to(socket.handshake.session.user.sid).emit("update_dms");
    })
});

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

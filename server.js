import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import loginRouter from './routes/auth.js';
import indexRouter from './routes/index.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import User from './userSchema.js';
import Message from './messageSchema.js';
import Room from './roomSchema.js';
import * as dotenv from 'dotenv';
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
        io.to(msgRoom).emit("dm_message", dbMsg, dbUser.picURL);
        await dbMsg.save();
    }
})

app.post('/loadMessages', async (req, res) => {
    const msgSession = req.session.user;

    const dbUser1 = await User.findOne({ 'username': msgSession.username, 'hashed_password': msgSession.hashed_password }).exec();
    const dbUser2 = await User.findOne({ 'username': req.body.dmName });
    let anyMessages = await Message.find({ 'room': req.body.room });
    if (anyMessages.length == 0) {
        anyMessages = await Message.find({ 'room': msgSession.username, 'username': req.body.room });
        if (anyMessages.length == 0) {
            return res.send();
        }
    }

    let sendMessages = [];
    anyMessages.forEach((msg) => {
        let pfp = 'pfp.jpg';
        if (msg.username == dbUser1.username) {
            pfp = dbUser1.picURL;
        }
        else if (msg.username == dbUser2.username) {
            pfp = dbUser2.picURL
        }
        sendMessages.push({ msg, pfp });
    })
    res.send(sendMessages);
})

app.post('/loadRooms', async (req, res) => {
    const msgSession = req.session.user;
    let allWithUser = await Room.findOne({ 'names': { $all: [msgSession.username, req.body.toDM] } });
    if (allWithUser == null || !allWithUser) {
        const newRoom = new Room({ 'names': [msgSession.username, req.body.toDM] });
        await newRoom.save();
        allWithUser = newRoom;
    }
    const room = allWithUser.names.join("")
    if (!room) {
        const newRoom = new Room({ 'names': [msgSession.username, req.body.toDM] });
        await newRoom.save();
    }
    return res.send(room);
})

app.post('/loadDMs', async (req, res) => {
    const msgSession = req.session.user;
    const dbUser = await User.findOne({ 'username': msgSession.username, 'hashed_password': msgSession.hashed_password }).exec();
    let dms = []
    for (let i = 0; i < dbUser.dms.length; i++) {
        const dmingToName = dbUser.dms[i];
        const dmingTo = await User.findOne({ 'username': dmingToName });
        dms.push(dmingTo);
    }
    res.send(dms);
})

app.get('/getUser', async (req, res) => {
    const msgSession = req.session.user;
    const dbUser = await User.findOne({ 'username': msgSession.username, 'hashed_password': msgSession.hashed_password }).exec();
    res.send({ 'username': dbUser.username, 'picURL': dbUser.picURL });
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

io.on("connection", (socket) => {
    socket.on("change_dm", (newDm) => {
        socket.join(`${newDm}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
})

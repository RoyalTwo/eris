import express from 'express';
import User from '../userSchema.js';
import Message from '../messageSchema.js';
import Room from '../roomSchema.js';

const router = express.Router();

router.post('/loadMessages', async (req, res) => {
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

router.post('/loadRooms', async (req, res) => {
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

router.get('/loadDMs', async (req, res) => {
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

router.get('/getUser', async (req, res) => {
    const msgSession = req.session.user;
    const dbUser = await User.findOne({ 'username': msgSession.username, 'hashed_password': msgSession.hashed_password }).exec();
    res.send({ 'username': dbUser.username, 'picURL': dbUser.picURL });
})

export default router;
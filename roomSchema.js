import Mongoose from "mongoose";
const { Schema } = Mongoose;

const RoomSchema = new Schema({
    names: {
        type: Array,
    },
})
const Room = Mongoose.model('Room', RoomSchema);
export default Room;
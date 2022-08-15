import Mongoose from "mongoose";
const { Schema } = Mongoose;

const MessageSchema = new Schema({
    username: {
        type: String,
    },
    message: {
        type: String,
    },
    room: {
        type: String,
    },
})
const Message = Mongoose.model('Message', MessageSchema);
export default Message
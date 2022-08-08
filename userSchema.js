import Mongoose from "mongoose";
const { Schema } = Mongoose;

const UserSchema = new Schema({
    id: {
        type: String,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
    }
})
const User = Mongoose.model('User', UserSchema);
export default User
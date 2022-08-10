import Mongoose from "mongoose";
const { Schema } = Mongoose;

const UserSchema = new Schema({
    id: {
        type: String,
    },
    username: {
        type: String,
    },
    email: {
        type: String,
    },
    hashed_password: {
        type: String,
    },
    salt: {
        type: String,
    }
})
const User = Mongoose.model('User', UserSchema);
export default User
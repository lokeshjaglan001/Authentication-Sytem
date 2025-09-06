import mongoose from 'mongoose'

mongoose.connect(`mongodb://127.0.0.1:27017/express-7`)

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String
})

export default mongoose.model('user', userSchema)
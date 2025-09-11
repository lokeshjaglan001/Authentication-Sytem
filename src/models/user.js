import mongoose from 'mongoose'

mongoose.connect(`mongodb://127.0.0.1:27017/express-neo`)

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilepic: {
        data: {
            type: Buffer,
            required: false,
            default: null   // ✅ FIX: Safe default
        },
        contentType: {
            type: String,
            required: false,
            default: null   // ✅ FIX: Safe default
        }
   },
   posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
   }]
});

export default mongoose.model('user', userSchema)
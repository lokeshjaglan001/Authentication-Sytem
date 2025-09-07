import mongoose from 'mongoose';

mongoose.connect(`mongodb://127.0.0.1:27017/express-neo`)

const postSchema = new mongoose.Schema({
    title: {    
        type: String,
        required: true,
        trim: true  
    },
    content: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: String
    },
});

export default mongoose.model('post', postSchema);

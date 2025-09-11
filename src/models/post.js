import mongoose from 'mongoose';

mongoose.connect(`mongodb://127.0.0.1:27017/express-neo`)

const postSchema = new mongoose.Schema({
    username: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },  
    title: {    
        type: String,
        required: true,
        trim: true  
    },
    content: {
        type: String,
        required: true
    },
    likes : [
        {   type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: []
        }
    ]
});

export default mongoose.model('post', postSchema);

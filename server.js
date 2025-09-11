import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userSchema from './src/models/user.js';
import postSchema from './src/models/post.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { requiredAuth } from './src/middlewares/requiredAuth.js';
import { redirectIfLoggedIn } from './src/middlewares/redirectIfLoggedIn.js';
import upload from './src/middlewares/multer.middleware.js'
import fs from 'fs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"src", "views"));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));


app.get('/',redirectIfLoggedIn, (req, res) => {
    res.render('form');
});


app.get('/login',redirectIfLoggedIn, (req, res) => {
    res.render('login');
});


app.get('/postedit' , requiredAuth , async (req , res)=>{
    res.render('postedit')
})


app.get('/home', requiredAuth, async (req, res) => {
    try {
        const user = await userSchema.findById(req.user.userid);
        const posts = await postSchema.find().populate("username"); 
        if (!user) {
            res.clearCookie('token'); 
            return res.redirect('/login');
        }
        res.render('home', { user, posts });
    } catch (err) {
        console.log(err);
        res.redirect('/login');
    }
});


app.get('/postpage' , requiredAuth , async(req , res)=>{
    res.render('post')
})


app.post('/create', upload.single('profilepic'), async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let profilepic = null;
        if (req.file) {
            profilepic = {
                data: fs.readFileSync(req.file.path),
                contentType: req.file.mimetype
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userSchema.create({
            username,
            email,
            password: hashedPassword,
            profilepic
        });

        const token = jwt.sign({ email: user.email, userid: user._id }, 'shhhh', {
            expiresIn: '7d'
        });

        res.cookie('token', token, {
            httpOnly: true, // secure option if needed
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.redirect('/home');
    } catch (err) {
        console.log(err);
        return res.redirect('/');
    }
});


app.post('/post',requiredAuth, async(req , res)=>{
    if (!req.user) {
        return res.status(401).send('Unauthorized: User not authenticated');
    }
    let user = await userSchema.findOne({email : req.user.email})
    const { title , content} = req.body
    const post = await postSchema.create({
        username: user._id,
        title,
        content,
    })

    user.posts.push(post._id)
    await user.save()
    res.redirect('/home')
})


app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userSchema.findOne({ email });
    if (!user) return res.redirect('/login');

    bcrypt.compare(password, user.password, function (err, result) {
        if (err) return res.redirect('/login');

        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, 'shhhh');
            res.cookie('token', token);
            return res.redirect('/home');
        } else {
            return res.redirect('/login');
        }
    });
});


app.get('/logout', requiredAuth, (req, res) => {
    res.clearCookie('token'); 
    res.redirect('/login');
});


app.get('/edit/:id', requiredAuth, async (req, res) => {
    try {
        const user = await userSchema.findById(req.params.id);
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.render("edit", { user });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});


app.post('/update/:id', requiredAuth, upload.single('profilepic'), async (req, res) => {
    try {
        const { username, email } = req.body;

        const user = await userSchema.findById(req.params.id);
        if (!user) {
            return res.status(404).send("User not found");
        }

        user.username = username || user.username;
        user.email = email || user.email;

        if (req.file) {
            user.profilepic = {
                data: fs.readFileSync(req.file.path),
                contentType: req.file.mimetype
            };
        }

        await user.save();

        res.redirect('/home');
    } catch (err) {
        console.error(err);
        res.status(500).send("Update failed");
    }
});


app.delete('/delete/:id', requiredAuth, async (req, res) => {
    try {
        await userSchema.findByIdAndDelete(req.params.id);
        
        res.clearCookie('token');
        
        return res.status(200).json({ 
            success: true, 
            message: "User deleted successfully",
            redirect: '/login' 
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something Went Wrong" });
    }
});


app.get('/user/:id/profilepic', async (req, res) => {
  try {
    const user = await userSchema.findById(req.params.id);
    if (!user || !user.profilepic) {
      return res.sendStatus(404);
    }

    res.set('Content-Type', user.profilepic.contentType); // e.g., 'image/png'
    res.send(user.profilepic.data); // send the Buffer
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});


app.get('/like/:id', requiredAuth , async (req , res)=>{
    let post = await postSchema.findOne({_id: req.params.id}).populate('username')
    
    if (post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid)
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid) , 1)
    }

    await post.save()
    res.status(200).json({message:"Liked success"})
})

app.get('/editPost/:id' , async (req , res)=>{
    try {
        const post = await postSchema.findById({_id : req.params.id}).populate('username');
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.render("postedit", { post });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
})

app.post('/updatePost/:id' , async (req , res)=>{
    let post = await postSchema.findOneAndUpdate({_id: req.params.id} , {content: req.body.content , title : req.body.title} )
    
    res.redirect('/home')
})






app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

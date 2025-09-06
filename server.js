import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userSchema from './models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { requiredAuth } from './middlewares/requiredAuth.js';
import { redirectIfLoggedIn } from './middlewares/redirectIfLoggedIn.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


app.get('/',redirectIfLoggedIn, (req, res) => {
    res.render('form');
});


app.get('/login',redirectIfLoggedIn, (req, res) => {
    res.render('login');
});


app.get('/home', requiredAuth, async (req, res) => {
    try {
        const user = await userSchema.findById(req.user.userid); 
        if (!user) {
            res.clearCookie('token'); 
            return res.redirect('/login');
        }
        res.render('home', { user });
    } catch (err) {
        console.log(err);
        res.redirect('/login');
    }
});


app.post('/create', async (req, res) => {
    let { username, email, password } = req.body;
    let user = await userSchema.findOne({ email });
    if (user) return res.redirect('/');

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userSchema.create({
                username,
                email,
                password: hash
            });
            let token = jwt.sign({ email: email, userid: user._id }, 'shhhh');
            res.cookie('token', token);
            return res.redirect('/login');
        });
    });
});


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


app.post('/update/:id', requiredAuth, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        await userSchema.findByIdAndUpdate(req.params.id, {
            username,
            email
        });
        res.redirect('/home'); 

    } catch (err) {
        console.log(err);
        res.status(500).send("Update failed");
    }
});


app.delete('/delete/:id', requiredAuth, async (req, res) => {
    try {
        await userSchema.findByIdAndDelete(req.params.id); 
        res.status(200).json({ message: "User deleted successfully" });
        res.redirect('/login')
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something Went Wrong" });
    }
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

import jwt from 'jsonwebtoken'

export function redirectIfLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) return next(); 

    try {
        jwt.verify(token, 'shhhh'); 
        return res.redirect('/home');
    } catch (err) {
        res.clearCookie('token'); 
        return next();
    }
}
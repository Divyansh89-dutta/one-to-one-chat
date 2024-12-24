require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/user.model');
const Message = require('./models/message.model');
const connect = require('./db/db');

connect(process.env.MONGO_URI);

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            const email = profile.emails[0].value;
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    googleId: profile.id,
                    email,
                    displayName: profile.displayName,
                    image: profile.photos[0].value,
                });
            }
            done(null, user);
        }
    )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => done(null, await User.findById(id)));

app.get('/', (req, res) => res.render('index'));
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => res.redirect('/chat'));

app.get('/chat', async (req, res) => {
    if (!req.user) return res.redirect('/');
    
    const onlineUsers = await User.find({ socketId: { $ne: null } });
    res.render('chat', { user: req.user, onlineUsers });
});

app.get('/messages/:id', async (req, res) => {
    const messages = await Message.find({
        $or: [
            { senderId: req.user._id, receiverId: req.params.id },
            { senderId: req.params.id, receiverId: req.user._id },
        ],
    }).sort('timestamp');
    res.json(messages);
});

const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('join', async (user) => {
        socket.request.user = user;
        await User.findByIdAndUpdate(user._id, { socketId: socket.id });
        io.emit('updateOnlineUsers', await User.find());
    });

    socket.on('disconnect', async () => {
        const user = await User.findOneAndUpdate(
            { socketId: socket.id },
            { socketId: null, lastseen: new Date() }
        );
        if (user) io.emit('updateOnlineUsers', await User.find());
    });
    

    socket.on('message', async ({ receiverId, message }) => {
        const msg = await Message.create({ senderId: socket.request.user._id, receiverId, message });
        const receiver = await User.findById(receiverId);
        if (receiver.socketId) socket.to(receiver.socketId).emit('message', msg);
    });
});

server.listen(5000, () => console.log('Server running on http://localhost:4000'));

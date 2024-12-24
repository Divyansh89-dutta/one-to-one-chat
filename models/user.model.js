/* 
socketId - sabhi users ke liye unique hota hai
        - har bar change hota hai jab bhi user login karta hai
*/


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
    socketId: {
        type: String,
        default: ''
    },
    lastseen: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true
    }
);


const User = mongoose.model('User', userSchema);

module.exports = User;
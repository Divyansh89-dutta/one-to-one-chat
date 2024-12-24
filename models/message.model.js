const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    lastseen: { type: Date, default: Date.now }
},{
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);

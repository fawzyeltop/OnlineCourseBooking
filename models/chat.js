const mongoose = require('mongoose');
let chatSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    senderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});
let Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
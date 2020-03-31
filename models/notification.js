const mongoose = require('mongoose');
let notificationchema = new mongoose.Schema({
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    Date: {
        type: Date,
        default: Date.now()
    }
});
let Notification = mongoose.model('Notification', notificationchema);
module.exports = Notification;
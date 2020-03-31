const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: 'Online Course Booking is a web application that allows you to book course online by contacting with the owner of this course'
    },
    username: {
        type: String,
        default: 'AbdoAlprinceX'
    },
    avatar: {
        type: String,
        default: 'avatar.jpg'
    },
    fromStatus: {
        type: String,
        default: 'reservation'
    },
    accountToken: {
        type: String,
        required: true
    },
    accountVerified: {
        type: Boolean,
        default: false
    },
    accountActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        required: true
    },
    tags: {
        type: Array,
        required: true,
        default: ['English', 'Arabic', 'Maths']
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});
let User = mongoose.model('User', userSchema);
module.exports = User;
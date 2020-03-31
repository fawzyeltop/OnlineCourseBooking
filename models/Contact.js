const mongoose = require('mongoose');
let contactSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    problem: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    } 
});
let Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;
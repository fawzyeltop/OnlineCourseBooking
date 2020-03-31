const mongoose = require('mongoose');
let reviewschema = new mongoose.Schema({
    instructorID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    stars: {
        type: Number,
        required: true
    },
    myDate: {
        type: Date,
        default: Date.now()
    }
});
let Review = mongoose.model('Review', reviewschema);
module.exports = Review;
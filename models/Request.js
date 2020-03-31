const mongoose = require('mongoose');
let requestSchema = new mongoose.Schema({
    instructorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

  users: [{
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    paymentWay: { type: String, required: true },
    acceptanceStatus: { type: Boolean, required: true }
  }],
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    }
});
let Request = mongoose.model('Request', requestSchema);
module.exports = Request;
const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const { ensureAuthenticated } = require('../config/auth');

router.post('/', ensureAuthenticated, async (req, res, next) => {
  let chats = await Chat.find({ courseID: req.body.courseID }).populate("courseID").populate("senderID");
  res.json(chats);
});

module.exports = router;

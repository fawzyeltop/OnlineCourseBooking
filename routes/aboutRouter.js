const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { forwardAuthenticated } = require('../config/auth');
router.get('/', forwardAuthenticated, (req, res, next) => {
    res.render('about');
});

module.exports = router;
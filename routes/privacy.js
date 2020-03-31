const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../config/auth');
router.get('/', forwardAuthenticated, (req, res) => {
    res.render('privacy');
});

module.exports = router;
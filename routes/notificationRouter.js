const express = require('express');
const router = express.Router();
const Notification = require("../models/notification");
const { ensureAuthenticated } = require('../config/auth');
router.get('/', ensureAuthenticated, async (req, res, next) => {
    if (req.user.role === "User") {
        const notifications = await Notification.find({ userID: req.user.id, Date: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).populate("courseID");
        let arrOfNotifications = [];
        for (let i = 0; i < notifications.length; i = i + 4) {
            arrOfNotifications.push(notifications.slice(i, i + 4));
        }
        res.render('notification', { notifications: arrOfNotifications });
    } else {
        req.flash("error", "Change your role to User to be able to view this page");
        res.redirect("/user/profile");
    }
});

module.exports = router;
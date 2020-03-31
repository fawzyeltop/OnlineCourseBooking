const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const moment = require("moment");
const { ensureAuthenticated } = require('../config/auth');
router.get('/:courseID', ensureAuthenticated, (req, res, next) => {
    if (req.user.role === "User") {
        if (req.params.courseID.match(/^[0-9a-fA-F]{24}$/)) {
            Course.findById({ _id: req.params.courseID }).populate("instructorID").exec((err, course) => {
                if (err) throw new Error(err.message);
                if (!course) {
                    req.flash("error", "Something wrong happened");
                    res.redirect("/user/profile");
                } else {
                    res.render("course", { course, moment });
                }
            });
        } else {
            req.flash("error", "Something wrong happened");
            res.redirect(`/user/profile`);
        }
    } else {
        req.flash("error", "Change your role to User to be able to view this page");
        res.redirect("/user/profile");
    }

})
module.exports = router;

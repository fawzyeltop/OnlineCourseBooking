const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const Course = require('../models/Course')
const Chat = require('../models/chat');
const moment = require("moment");
const { ensureAuthenticated } = require('../config/auth');
router.get('/:courseID', ensureAuthenticated, (req, res, next) => {
    if (req.params.courseID.match(/^[0-9a-fA-F]{24}$/))  {
        Course.findById({ _id: req.params.courseID }).populate("instructorID").populate("users.userID").exec((err, course) => {
            if(err) throw new Error(err.message);
            if(!course) {
                req.flash("error", "Something wrong happened");
                res.redirect("/user/profile");
            } else {
                if(req.user.id == course.instructorID._id) {
                    res.render("chat", { course, moment });
                } else {
                    for(var i = 0; i < course.users.length; i++) {
                        if(req.user.id == course.users[i].userID._id) {
                            res.render("chat", { course, moment });
                            break;
                        }
                    }
                    if(i == course.users.length) {
                        req.flash("error", "Something wrong happened");
                        res.redirect("/user/profile");
                    }
                }
            }
        });
    } else {
        req.flash("error", "Something wrong happened");
        res.redirect(`/user/profile`);
    }
})

module.exports = router;

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const User = require('../models/user');
const { check, validationResult } = require('express-validator');
const { forwardAuthenticated } = require('../config/auth');

// Get Request 
router.get('/', forwardAuthenticated, (req, res, next) => {
    res.render('contact', { errors: req.flash("errors") });
});

// Post Request 
router.post('/', [
    check("email").isEmail().withMessage("Email must be correct"),
    check("message").not().isEmpty().withMessage("Message cannot be empty").isLength({ max: 255 }).withMessage("Message must be 255 chars at most")
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        res.redirect('/contact');
    } else {
        User.findOne({ email: req.body.email }, (err, user) => {
            if (err) console.error(err.message);
            if (!user) {
                req.flash("error", "The email is not already exist");
                res.redirect("/contact");
            } else {
                Contact.findOne({ email: req.body.email }, (err, contact) => {
                    if (err) console.log(err);
                    if (contact) {
                        req.flash("error", "You can send again after reviewing");
                        res.redirect("/contact");
                    } else {
                        let newContact = new Contact({
                            email: req.body.email,
                            fullname: user.fullname,
                            gender: user.gender,
                            location: user.location,
                            problem: req.body.problem,
                            message: req.body.message
                        });
                        newContact.save()
                            .then((Doc) => {
                                console.log(`The Problem sent by ${Doc.fullname}`);
                                req.flash("success", "Problem has been sent successfully");
                                res.redirect("/contact");
                            })
                            .catch((err) => console.error(err.message))
                            .finally(() => console.log('Code written by Love'));
                    }
                })

            }
        });
    }
});


module.exports = router;
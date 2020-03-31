const express = require('express');
const router = express.Router();
const passport = require('passport');
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { forwardAuthenticated } = require('../config/auth');
const { check, validationResult } = require('express-validator');
router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('login', { errors: req.flash('errors') });
});
router.get('/forgotPassword', (req, res, next) => {
  res.render('forgotPassword');
});
router.post('/forgotPassword', (req, res, next) => {

  async.waterfall([

    function (done) {
      crypto.randomBytes(20, (err, buf) => {
        var token = buf.toString('hex');
        done(err, token);
      });
    },

    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          res.redirect('/user/forgotPassword');
        } else {
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000;
          user.save(function (err) {
            done(err, token, user);
          });
        }
      });
    },

    function (token, user, done) {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'AbdulrahmanFawzy999@gmail.com',
          pass: 'sxgqljelmksfsuuo'
        }
      });
      let mailOptions = {
        to: user.email,
        from: 'AbdulrahmanFawzy999@gmail.com',
        subject: 'Reset your password',
        html: `
              <p> You are receiving this because you (or someone else) have requested the reset of the password for your account. 
              </p>
              <p>
              Please click on the following link to complete the process
              </p>
              <a href= "https://onlinecoursebooking.herokuapp.com/reset/${user.id}/${token}">Follow</a>
              <p>If you did not request this, please ignore this email and your password will remain unchanged. </p>`
      };
      transporter.sendMail(mailOptions, function (err) {
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/user/forgotPassword');
  });
});
router.get('/reset/:id/:token', (req, res, next) => {
  User.findOne({ _id: req.params.id, resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (err) console.log(err.message);
    if (user) res.render('resetPassword', { userID: req.params.id, resetPasswordToken: req.params.token });
    else {
      req.flash("error", "Something wrong happened");
      res.redirect("/user/forgotPassword");
    }
  });
});
router.post('/resetPassword', function (req, res) {
  User.findOne({ _id: req.body.userID, resetPasswordToken: req.body.resetPasswordToken, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (err) console.log(err.message);
    if (!user) res.redirect(`/user/reset/${req.body.userID}/${req.body.resetPasswordToken}`);
    else {
      if (req.body.password.trim().length === 0 || req.body.confirmPassword.trim().length === 0) {
        req.flash("error", "Please fill out all fields");
        res.redirect(`/user/reset/${req.body.userID}/${req.body.resetPasswordToken}`);
      }
      else if (req.body.password != req.body.confirmPassword) {
        req.flash('error', 'Two passwords are not matched');
        res.redirect(`/user/reset/${req.body.userID}/${req.body.resetPasswordToken}`);
      } else {
        bcrypt.genSalt(10, function (err, salt) {
          if (err) console.log(err);
          bcrypt.hash(req.body.password, salt, function (err, hash) {
            if (err) console.log(err);
            user.password = hash;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save()
              .then((Doc) => {
                req.flash('success', `Welcome ${Doc.fullname} Your password has been changed`);
                res.redirect('/user/login');
              })
              .catch((err) => console.log(err.message))
          });
        });
      }
    }
  });
});

router.post('/login/auth', [
  check('email').isEmail().withMessage("Email must be correct"),
  check('password').not().isEmpty().withMessage("The password cannot be empty")
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('errors', errors.array());
    res.redirect('/user/login');
  } else {
    passport.authenticate('local.login', {
      successRedirect: '/user/profile',
      failureRedirect: '/user/login',
      failureFlash: true
    })(req, res);
  }
});
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));
router.get('/auth/facebook/login',
  passport.authenticate('facebook', {
    successRedirect: '/user/profile',
    failureRedirect: '/user/login'
  }));

module.exports = router;
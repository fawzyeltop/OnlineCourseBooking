const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const randomstring = require("randomstring");
const nodemailer = require('nodemailer');
// Signup Strategy for student
passport.use('local.signup', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, username, password, done) => {
    if (req.body.password != req.body.confirmPassword) {
        return done(null, false, req.flash('error', 'Passwords are not matched'))
    } else {
        User.findOne({ email: username }, async (err, user) => {
            if (err) {
                return done(err)
            }
            if (user) {
                return done(null, false, req.flash('error', 'Email is already exist'))
            }
            if (!user) {
                let newUser = new User();
                let token = randomstring.generate({ length: 64 });
                newUser.fullname = req.body.fullname;
                newUser.phone = req.body.phone;
                newUser.email = req.body.email;
                newUser.location = req.body.location;
                newUser.gender = req.body.gender;
                newUser.accountToken = token;
                newUser.role = req.body.role;
                newUser.password = await bcrypt.hash(req.body.password, 10);
                newUser.save((err, user) => {
                    if (err) throw err;
                    else {
                        let transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'AbdulrahmanFawzy999@gmail.com',
                                pass: 'sxgqljelmksfsuuo'
                            }
                        });
                        let mailOptions = {
                            from: 'Teacherou',
                            to: `${user.email}`,
                            subject: 'Email Verification',
                            html: `
                             <h3> How are you ${user.fullname}? We hope that you are good </h3>
                                <p>
                                <span> To verify your email follow this link:  </span>
                                <a href="http://localhost:3000/user/verify/${user.id}/${user.email}/${user.accountToken}" target="_blank"> Verify now </a>
                               </p>
                            `
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                        return done(null, user);
                    }
                })
            }
        })
    }

}));
// login strategy fot student
passport.use('local.login', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, username, password, done) => {

    User.findOne({ email: username }, (err, user) => {

        if (err) {
            return done(null, false, req.flash('error', 'Something wrong happened'))
        }
        if (!user) {
            return done(null, false, req.flash('error', 'user was not found'))
        }
        if (user) {
            if ((user.fromStatus) === 'facebook') {
                return done(null, false, req.flash('error', 'This account can login with facebook.'));
            } else {
                bcrypt.compare(password, user.password, (err, res) => {
                    if (err) console.log(err);
                    else {
                        if (res) {
                            User.findByIdAndUpdate({ _id: user._id }, { accountActive: true }, { "new": true })
                                .then((Doc) => {
                                    console.log(`accountActive is set to ${Doc.accountActive}`)
                                    return done(null, user);
                                })
                                .catch((err) => console.log(err.message))
                                .finally(() => console.log("Code is written with Love"))
                        } else {
                            return done(null, false, req.flash('error', 'Password is wrong'));
                        }
                    }
                });
            }
        }
    })
}));

// Login with facebook
passport.use(new FacebookStrategy({
    clientID: '492179621633101',
    clientSecret: '6ccfe53db3fd33e04f5a69d9dbf07abd',
    callbackURL: "/user/auth/facebook/login",
    profileFields: ['displayName', 'email'],
    passReqToCallback: true
},
    function (req, accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            User.findOne({ email: profile._json.email }, (err, user) => {
                if (err) return done(null, false, req.flash('error', 'Something wrong happened'))
                if (user) {
                    if ((user.fromStatus) === 'reservation') {
                        return done(null, false, req.flash('error', 'This account can login with website.'));
                    } else {
                        user.accountActive = true; user.save();
                        return done(null, user);
                    }
                }

                else {
                    let newUser = new User();
                    let token = randomstring.generate({ length: 64 });
                    newUser.fullname = profile.displayName;
                    newUser.phone = '000'
                    newUser.email = profile._json.email;
                    newUser.location = "Cairo";
                    newUser.gender = "Unknown";
                    newUser.password = "userfromfacebook";
                    newUser.fromStatus = 'facebook';
                    newUser.accountToken = token;
                    newUser.role = "User";
                    newUser.accountActive = true;
                    newUser.save((err, user) => {
                        if (err) throw err;
                        else {
                            let transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: 'AbdulrahmanFawzy999@gmail.com',
                                    pass: 'sxgqljelmksfsuuo'
                                }
                            });
                            let mailOptions = {
                                from: 'Teacherou',
                                to: `${newUser.email}`,
                                subject: 'Email Verification',
                                html: `
                                 <h3> How are you ${newUser.fullname}? We hope that you are good </h3>
                                    <p>
                                    <span> To verify your email follow this link:  </span>
                                    <a href="https://onlinecoursebooking.herokuapp.com//user/verify/${newUser.id}/${newUser.email}/${newUser.accountToken}" target="_blank"> Verify now </a>
                                   </p>
                                `
                            };

                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                            });
                            return done(null, user);
                        }
                    })
                }
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        if (err) done(err);
        done(null, user);
    })
});
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('../models/user');
const Course = require('../models/Course');
const Review = require('../models/Review');
const { check, validationResult } = require('express-validator');
const { ensureAuthenticated } = require('../config/auth');
const multer = require('multer');
const moment = require("moment");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

router.get('/profile/search', function (req, res) {

    Course.find({ coursename: { $regex: '.*' + req.query.key + '.*' } }).limit(5).exec((err, courses) => {
        if (err) console.log(err);
        else res.send(courses);
    })
});
router.get('/profile', ensureAuthenticated, async (req, res, next) => {
    const users = await User.aggregate([ { $match: { _id: {$ne: mongoose.Types.ObjectId(req.user.id)}, role: "User" } }, { $sample: { size:  20 } } ])
    const instructors = await User.aggregate([ { $match: { _id: {$ne: mongoose.Types.ObjectId(req.user.id) }, role: "Instructor" } }, { $sample: { size:  20 } } ])
    const coursesForShow = await Course.aggregate([ { $match: { coursename: { $in: req.user.tags } } }, { $sample: { size:  20 } } ])
    const courses = await Course.find({ }).populate("instructorID");
    let arrOfCourses = [];
    for (let i = 0; i < courses.length; i = i + 2) {
        arrOfCourses.push(courses.slice(i, i + 2));
    }
    res.render('profile', { errors: req.flash('errors'), courseDocs: arrOfCourses, moment: moment,   users: users, instructors: instructors, coursesForShow: coursesForShow, courses: courses })
});
router.get('/profile/reviews/:instructorID', async (req, res, next) => {
    if (req.params.instructorID.match(/^[0-9a-fA-F]{24}$/)) {
        const instructor =  await User.findById({ _id: req.params.instructorID });
        const reviewsCount = await Review.find({ instructorID: req.params.instructorID }).count({ });
        const courses = await Course.find({ instructorID: req.params.instructorID });
        const pageCount = Math.ceil(reviewsCount / 5)
        if(req.query.pageNo === undefined || req.query.pageNo <= 0 || req.query.pageNo > pageCount) req.query.pageNo = 1;
        res.render('review', {instructor: instructor, courses: courses, pageCount: pageCount, pageNo: req.query.pageNo, errors: req.flash('errors') })
    } else {
        req.flash("error", "Something wrong happened");
        res.redirect("/user/profile");
    }
})
router.get('/profile/reviews/:instructorID/process', async(req, res, next) => {
    const reviews = await Review.find({ instructorID: req.params.instructorID }).populate("userID").limit(5).skip((Number(req.query.pageNo) - 1) * 5).lean().exec()
    res.json(reviews);
})
router.post("/profile/changeRoleToUser", (req, res, next) => {
    if(req.user.role === "Instructor") {
        User.findByIdAndUpdate({ _id: req.user.id }, { role: "User" }, { new: true }, (err, resDB) => {
            if(err) console.log(err.message);
            else {
                console.log(`${resDB} has been updated successfully`);
                req.flash("success", "Your role has been changed to User successfully");
                res.redirect("/user/profile");
            }
        })
    } else {
        req.flash("error", "This is a service for only Instructors");
        res.redirect("/user/profile");
    }
});
router.post("/profile/changeRoleToInstructor", (req, res, next) => {
    if(req.user.role === "Instructor") {
        User.findByIdAndUpdate({ _id: req.user.id }, { role: "Instructor" }, { new: true }, (err, resDB) => {
            if(err) console.log(err.message);
            else {
                console.log(`${resDB} has been updated successfully`);
                req.flash("success", "Your role has been changed to Instructor successfully");
                res.redirect("/user/profile");
            }
        })
    } else {
        req.flash("error", "This is a service for only Instructors");
        res.redirect("/user/profile");
    }
});
router.post('/profile/reviews/:instructorID', [
    check('feedback').not().isEmpty().withMessage("Comment cannot be empty").isLength({ max: 255 }).withMessage("Maximum chars are 255"),
    check('rating').isIn(["1", "2", "3", "4", "5"]).withMessage("Rating must be between 1 and 5")
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        res.redirect(`/user/profile/reviews/${req.params.instructorID}`);
    } else {
        new Review({
            instructorID: req.params.instructorID,
            userID: req.user.id,
            comment: req.body.feedback,
            stars: Number(req.body.rating)
        }).save((err, result) => {
            if(err) throw new Error(err.message);
            else {
                console.log(`${result} is saved to mongoDB`);
                req.flash("success", "Your feedback has been arrived to the instructor");
                res.redirect(`/user/profile/reviews/${req.params.instructorID}`);
            }
        })
    }
});
router.get('/profile/getVal', (req, res, next) => {
    if (req.query.chargeResponse) {
        Course.findById({ _id: JSON.parse(req.query.chargeResponse).merchantRefNumber }, (err, result) => {
            if (err) console.log(err);
            else {
                req.flash("success", `The fawry process is completed successfully. Pay ${result.courseprice * 20} pounds on our fawry identifier (500) by ${JSON.parse(req.query.chargeResponse).fawryRefNumber}`);
                res.redirect("/user/profile");
            }
        })
    } else {
        req.flash("error", "The fawry process is not completed successfully");
        res.redirect("/user/profile");
    }
});
router.post("/profile", (req, res, next) => {
    let myQuery = {};
    if (req.body.coursename === "all") myQuery = { coursename: { $ne: req.body.coursename }, courseprice: Number(req.body.courseprice) }
    else myQuery = { coursename: req.body.coursename + " Course", courseprice: Number(req.body.courseprice) }
    Course.find(myQuery, (err, courseDocs) => {
        if (err) console.log(err.message);
        else {
            console.log(courseDocs.length);
            let arrOfCourses = [];
            for (let i = 0; i < courseDocs.length; i = i + 2) {
                arrOfCourses.push(courseDocs.slice(i, i + 2));
            }
            res.render('profile', { errors: req.flash('errors'), courseDocs: arrOfCourses, moment: moment });
        }
    });
});
/************** Here is working for Instructor Dashboard /**************/
router.get('/profile/dashboard', ensureAuthenticated, async (req, res, next) => {
    
    if (req.isAuthenticated() && req.user.role === "User") res.redirect("/user/profile");
    else {
        let courseDocs = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users.userID");
        res.render("dashboard", { errors: req.flash("errors"), courseDocs: courseDocs, moment: moment });
    }
})
router.post("/profile/dashboard/acceptUser", (req, res, next) => {
    Course.update({ instructorID: req.user.id, _id: req.body.courseID, 'users.userID': req.body.userID }, { '$set': { 'users.$.acceptanceStatus': true } }, function (err) {
        if (err) console.log(err.message);
        else {
            req.flash("success", " The User has been member of the group");
            res.redirect("/user/profile");
        }
    })
})
router.post("/profile/dashboard/removeCourse", (req, res, next) => {
    Course.findByIdAndRemove({ _id: req.body.courseID }, (err) => {
        if (err) console.log(err.message);
        else {
            console.log("Course has been removed successfully");
            req.flash("success", "Your course has been removed successfully");
            res.redirect("/user/profile");
        }
    })
});
router.post("/profile/dashboard/emptyUsers", (req, res, next) => {
    Course.findByIdAndUpdate({ _id: req.body.courseID }, { users: [] }, { "new": true }, (err, course) => {
        if (err) console.log(err.message);
        else {
            console.log(`${course} has been updated`);
            req.flash("success", "Users are empty now");
            res.redirect("/user/profile");
        }
    })
});
// Here is for uploading photo for the center
const storagePhotoForCenter = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'assets/centerphotos')
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + `${path.extname(file.originalname)}`);
    }
})

const uploadPhotoForCenter = multer({
    storage: storagePhotoForCenter,
    limits: { fileSize: 1024 * 1024 },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext === '.png' || ext === '.jpg' || ext === '.gif' || ext === '.jpeg') callback(null, true)
        else return callback(new Error('Only images with png, jpg, gif or jpeg are allowed'))
    }
}).single('centerphoto');
router.post("/uploadCenterPhoto/:id", (req, res, next) => {
    uploadPhotoForCenter(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/user/profile');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/user/profile');
            } else {
                Course.updateOne({ _id: req.params.id }, { centerphoto: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The photo is updatted successfully');
                        res.redirect('/user/profile');
                    }
                })
            }
        }
    })
});
// Here is for uploading video for the course
const storageVideoForCourse = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'assets/coursevideos')
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + `${path.extname(file.originalname)}`);
    }
})

const uploadVideoForCourse = multer({
    storage: storageVideoForCourse,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext === '.mp4' || ext === '.mpg' || ext === '.gif' || ext === '.webm') callback(null, true)
        else return callback(new Error('Only videos with mp4, mpg, gif or webm are allowed'))
    }
}).single('coursevideo');
router.post("/uploadCourseVideo/:id", (req, res, next) => {
    uploadVideoForCourse(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/user/profile');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/user/profile');
            } else {
                Course.updateOne({ _id: req.params.id }, { coursevideo: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The video is updatted successfully');
                        res.redirect('/user/profile');
                    }
                })
            }
        }
    })
});
/************** Here is working for Instructor Dashboard /**************/

/************** Here is working for booking course /**************/

router.post("/profile/paymentByCash", (req, res, next) => {
    Course.findOne({ instructorID: req.body.instructorID, _id: req.body.courseID }, (err, result) => {
        if (err) console.log(err.message);
        if (!result) {
            console.log("Something wrong happened");
            req.flash("error", " Something wrong happened");
            res.redirect("/user/profile");
        } else {
            for (var i = 0; i < result.users.length; i++) {
                if (req.user.id == result.users[i].userID && result.users[i].acceptanceStatus === true) {
                    req.flash("error", "You are member in this course");
                    res.redirect("/user/profile");
                    break;
                } else if (req.user.id == result.users[i].userID && result.users[i].acceptanceStatus === false) {
                    req.flash("error", "You are pending until the instructor accepts you");
                    res.redirect("/user/profile");
                    break;
                }
            }
            if (i === result.users.length) {
                Course.findOneAndUpdate({ instructorID: req.body.instructorID, _id: req.body.courseID }, { $push: { users: { userID: req.user.id, paymentWay: "Cash", acceptanceStatus: false } }, }, { "new": true }, (err, newRes) => {
                    if (err) console.log(err.message);
                    else {
                        console.log(` ${newRes} is updated`);
                        req.flash("success", "You have enrolled in this course");
                        res.redirect("/user/profile");
                    }
                })
            }
        }
    })
});

/************** Here is working for booking course /**************/

// router.post('/profile/dashboard/makecourse', [
//     check('coursename').not().isEmpty().withMessage("Course Name cannot be empty"),
//     check('coursebio').not().isEmpty().withMessage("Course Bio cannot be empty"),
//     check("courseprice").not().isEmpty().isNumeric().withMessage("Course Price should be with value its value is number"),
//     check('courselimited').not().isEmpty().isNumeric().withMessage("Course Limited should be with value its value is number"),
//     check("coursestart").not().isEmpty().withMessage("Course Start cannot be empty"),
//     check("courseend").not().isEmpty().withMessage("Course End cannot be empty"),
//     check("centerplace").not().isEmpty().withMessage("Center Place cannot be empty"),
// ], (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         req.flash('errors', errors.array());
//         res.redirect('/user/profile/dashboard');
//     } else {
//         new Course({
//             instructorID: req.user.id,
//             coursename: req.body.coursename,
//             coursebio: req.body.coursebio,
//             courseprice: req.body.courseprice,
//             courselimited: req.body.courselimited,
//             coursestart: req.body.coursestart,
//             courseend: req.body.courseend,
//             centerlocation: req.body.centerlocation,
//             centerplace: req.body.centerplace
//         }).save((err, course) => {
//             if (err) console.log(err.message);
//             else {
//                 console.log(`${course.coursename} has been added successfully`);
//                 req.flash("success", "Course has been added successfully");
//                 res.redirect("/user/profile/dashboard");
//             }
//         })
//     }
// });
router.post('/profile/edit', [
    check('fullname').isLength({ min: 6 }).withMessage('Fullname should be more than 6 chars'),
    check("email").isEmail().withMessage("Email must be correct"),
    check("bio").isLength({ max: 255 }).withMessage("Bio should be less than 255 chars"),
    check('phone').isLength({ min: 11, max: 11 }).withMessage('Phonenumber must be 11 chars').isNumeric().withMessage("Phone must be number only"),
    check("username").not().isEmpty().withMessage("Facebook username cannot be empty"),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        res.redirect('/user/profile');
    } else {
        const { fullname, email, bio, location, gender, phone, username } = req.body;
        const fetchedTags = await User.findById({ _id: req.user.id });
        console.log(fetchedTags.tags);
        var initialTags = [];
        if(req.user.role === "User") initialTags = req.body.tags.split(",");
        else initialTags = fetchedTags.tags;

        let currentEmail = "";
        User.findById({ _id: req.user.id }, (err, user) => {
            if (err) console.log(err);
            else {
                currentEmail = user.email;
            }
        });
        User.findOne({ _id: { $ne: req.user.id }, email: email }, (err, user) => {
            if (err) console.log(err.message);
            if (user) {
                req.flash("error", "Email is already exist");
                res.redirect("/user/profile");
            } else {
                User.findByIdAndUpdate({ _id: req.user.id }, { fullname: fullname, email: email, bio: bio, location: location, gender: gender, phone: phone, username: username, tags: initialTags }, { new: true }, (err, user) => {
                    if (err) console.log(err.message);
                    else {
                        if (currentEmail !== user.email) {
                            User.findByIdAndUpdate({ _id: req.user.id }, { accountVerified: false }, { "new": true }, (err, user) => {
                                if (err) console.log(err);
                                else console.log(`accountVerified is set to ${user.accountVerified}`);
                            });
                        }
                        req.flash("success", "Data is updated successfully");
                        res.redirect("/user/profile");
                    }
                })
            }
        })

    }
});
router.post('/profile', (req, res, next) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'AbdulrahmanFawzy999@gmail.com',
            pass: 'sxgqljelmksfsuuo'
        }
    });
    let mailOptions = {
        from: 'Teacherou',
        to: `${req.user.email}`,
        subject: 'Email Verification',
        html: `
         <h3> How are you ${req.user.fullname}? We hope that you are good </h3>
            <p>
            <span> To verify your email follow this link:  </span>
            <a href="http://localhost:3000/user/verify/${req.user.id}/${req.user.email}/${req.user.accountToken}" target="_blank"> Verify now </a>
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
    res.redirect('/user/profile');
    next();
});
router.get('/verify/:id/:email/:token', (req, res, next) => {
    if (req.isAuthenticated() === false) {
        req.flash("error", "Login first to verify your email");
        res.redirect('/user/login');
    } else {
        User.findOne({ _id: req.user.id, email: req.params.email, accountToken: req.params.token }, (err, user) => {
            if (err) console.log(err.message);
            if (user) {
                User.findByIdAndUpdate({ _id: req.params.id }, { accountVerified: true }, (err, Doc) => {
                    if (err) console.log(err.message);
                    else {
                        req.flash('success', `Your Email ${Doc.email} has been verified successfully`);
                        res.redirect('/user/profile');
                    }
                });
            }
            else {
                req.flash('error', `Something wrong happened`);
                res.redirect('/user/profile');
            }
        });
    }
});


router.post('/profile/change', [
    check('oldPassword').not().isEmpty().withMessage("Old password cannot be empty"),
    check('newPassword').not().isEmpty().withMessage("New password cannot be empty"),
    check("confirmPassword").not().isEmpty().withMessage("Confirm password cannot be empty"),
    check("newPassword").custom((value, { req, loc, path }) => {
        if (value !== req.body.confirmPassword) throw new Error("Two passwords are not matched");
        else return value;
    })], (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('errors', errors.array());
            res.redirect('/user/profile');
        } else {
            bcrypt.compare(req.body.oldPassword, req.user.password, async (err, result) => {
                if (err) console.log(err.message);
                else {
                    if (result) {
                        User.findByIdAndUpdate({ _id: req.user.id }, { password: await bcrypt.hash(req.body.newPassword, 10) }, { "new": true })
                            .then((user) => {
                                console.log(`${user.fullname} Password has been changes successfully`);
                                req.flash("success", "Password has been changed successfully");
                                res.redirect("/user/profile");
                            })
                            .catch((err) => console.log(err.message))
                    } else {
                        req.flash("error", "Old Password is wrong");
                        res.redirect("/user/profile");
                    }
                }
            });
        }
    });

router.post("/profile/removeAccount", (req, res, next) => {
    User.findByIdAndRemove({ _id: req.user.id }, (err) => {
        if (err) console.log(err.message);
        else {
            console.log("Account has been removed successfully");
            req.flash("success", "Your account has been removed successfully");
            res.redirect("/user/signup");
        }
    })
});

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'assets/uploads')
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + `${path.extname(file.originalname)}`);
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext === '.png' || ext === '.jpg' || ext === '.gif' || ext === '.jpeg') callback(null, true)
        else return callback(new Error('Only images with png, jpg, gif or jpeg are allowed'))
    }
}).single('avatar');

router.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/user/profile');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/user/profile');
            } else {
                User.updateOne({ _id: req.user.id }, { avatar: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The photo is updatted successfully');
                        res.redirect('/user/profile');
                    }
                })
            }
        }
    })
});

// const accountSid = 'AC3d1467106bdf2bd55f9a95213ca712ef';
// const authToken = 'aaad400171ebbed53c70167ff2d77845';
// const client = require('twilio')(accountSid, authToken);


router.get('/profile/logout', (req, res) => {
    User.findByIdAndUpdate({ _id: req.user.id }, { accountActive: false })
        .then((Doc) => console.log('Updated'))
        .catch((err) => console.log(err.message))
    req.logOut();
    req.flash('success', 'You are log out now');
    res.redirect('/user/login');
});

module.exports = router;

// https://dev.to/rexeze/how-to-build-a-real-time-chat-app-with-nodejs-socketio-and-mongodb-2kho
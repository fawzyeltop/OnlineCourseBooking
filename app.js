/*@ here we include express-framework @*/
const express = require('express');
const app = express();
const http = require("http").Server(app);
const io = require('socket.io')(http); 
app.set("io", io);
/*@ here we include express-framework @*/

/*@ here we include third-party middleware => responseTime @*/
const responseTime = require('response-time');
app.use(responseTime());
/*@ here we include third-party middleware => responseTime @*/

/*@ here we include third-party middleware => Morgan @*/
const morgan = require('morgan');
app.use(morgan('tiny'));
/*@ here we include third-party middleware => Morgan @*/

/*@ here we include third-party middleware => Cookie-Parser @*/
const cookieParser = require('cookie-parser');
app.use(cookieParser())
/*@ here we include third-party middleware => Cookie-Parser @*/

/*@ here we connect to DB @*/
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://fawzy:0120975049@onlinecoursebooking-vbcbx.gcp.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) console.log(err);
    else console.log('Connected to DB');
});
/*@ here we connect to DB @*/

/*@ here we include static-files @*/
const path = require('path');
app.use('/assets', express.static(path.join(__dirname, 'assets')));
/*@ here we include static-files @*/

/*@ Passport Configuration @*/
require('./config/passport');
/*@ Passport Configuration @*/


/*@ here we set-up body-parser @*/
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
/*@ here we set-up body-parser @*/


/*@ here we set-up template-engine @*/
app.set('view engine', 'ejs');
/*@ here we set-up template-engine @*/

// session as flash needs to session
const session = require('express-session');
app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 2592000000 * 12 }
}));
// falsh 
const flash = require('connect-flash');
app.use(flash());

/*@ here is special @*/

/*@ Passport middleware @*/
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
/*@ Passport middleware @*/

const paginate = require('express-paginate');
app.use(paginate.middleware(10, 50));


/*@ Global variables @*/
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});
/*@ Global variables @*/





/*@ here we include homeRouter @*/
const indexRouter = require('./routes/indexRouter');
app.use('/home', indexRouter);
/*@ here we include homeRouter @*/

/*@ here we include contactRouter @*/
const contactRouter = require('./routes/contactRouter');
app.use('/contact', contactRouter);
/*@ here we include contactRouter @*/

/*@ here we include aboutRouter @*/
const aboutRouter = require('./routes/aboutRouter');
app.use('/about', aboutRouter);
/*@ here we include aboutRouter @*/


/*@ here we include terms @*/
const termsRouter = require('./routes/terms');
app.use('/terms', termsRouter);
/*@ here we include terms @*/

/*@ here we include privacy @*/
const privacyRouter = require('./routes/privacy');
app.use('/privacy', privacyRouter);
/*@ here we include privacy @*/

/*@ here we include userRouter @*/
const signupRouter = require('./routes/signupRouter');
app.use('/user', signupRouter);
/*@ here we include userRouter @*/

/*@ here we include userRouter @*/
const loginRouter = require('./routes/loginRouter');
app.use('/user', loginRouter);
/*@ here we include userRouter @*/

/*@ here we include profileRouter @*/
const profileRouter = require('./routes/profileRouter');
app.use(`/user`, profileRouter);
/*@ here we include profileRouter @*/

/*@ here we include courseRouter @*/
const courseRouter = require('./routes/courseRouter');
app.use(`/course`, courseRouter);
/*@ here we include courseRouter @*/

/*@ here we include chatRouter @*/
const chatRouter = require('./routes/chatRouter');
app.use(`/chat`, chatRouter);
/*@ here we include chatRouter @*/

/*@ here we include chatRouter @*/
const chatRouterA = require('./routes/chatroute');
app.use(`/fetchData`, chatRouterA);
/*@ here we include chatRouter @*/

/*@ here we include notificationRouter @*/
const notificationRouter = require('./routes/notificationRouter');
app.use(`/notifications`, notificationRouter);
/*@ here we include notificationRouter @*/

/*@ Handle Error-404 @*/
app.get('*', (req, res, next) => {
    res.render('error404ForUsers');
    next();
});
/*@ Handle Error-404 @*/

//setup event listener
const User = require('./models/user');
const Notification = require('./models/notification');
const Course = require('./models/Course');
const Chat = require("./models/chat");
const UsersService = require('./UsersService')
const userService = new UsersService();
io.on("connection", socket => {
    socket.on('join', data => {
      userService.addUser({ socketID: socket.id, userID: data })
      console.log("After Connected");
      console.log(userService.getAllUsers());
    })
    socket.on("disconnect", () => {
      userService.removeUser(socket.id);
      console.log("After Disconnected");
      console.log(userService.getAllUsers());
    });
    socket.on("sendMessage", async data => {
      if(data.message.trim().length === 0) {
        socket.emit("emptyMessage", "Message cannot be empty")
      } else {
      let user = await User.findById({ _id: data.senderID });
      io.sockets.emit("received", { user: user, message: data.message });
      new Chat({ 
        message: data.message, 
        courseID: data.courseID, 
        senderID: data.senderID 
      }).save((err, result) => {
        if(err) console.log(err.message);
        else console.log(`${result} has been saved to mongoDB successfully`);
      })
    }
    })

    socket.on("courseData", async data => {
      let users = await User.find({ role: 'User' });
      console.log(`The length of users is equal to ${users.length}`);
      new Course({
        instructorID: data.instructorID,
        coursename: data.coursename,
        coursebio: data.coursebio,
        courseprice: data.courseprice,
        courselimited: data.courselimited,
        coursestart: data.coursestart,
        courseend: data.courseend,
        centerlocation: data.centerlocation,
        centerplace: data.centerplace
    }).save((err, course) => {
        if (err) console.log(err.message);
        else {
            socket.emit("doneMessageForPublishingCourse", {coursename: course.coursename, courseID: course._id});
            users.forEach((user) => {
              if((user.tags).includes(course.coursename)) {
                 new Notification({
                  courseID: course._id,
                  userID: user._id
                 }).save();
                  var users = userService.getUsersById(user._id);
                  for(var i = 0; i < users.length; i++) {
                      io.to(users[i].socketID).emit("courseData", {coursename: course.coursename, courseID: course._id});
                  }
              }
            });
        }
    })
    });

   
  
    //Someone is typing
    // socket.on("typing", data => {
    //   socket.broadcast.emit("notifyTyping", {
    //     user: data.user,
    //     message: data.message
    //   });
    // });
  
    //when soemone stops typing
  //   socket.on("stopTyping", () => {
  //     socket.broadcast.emit("notifyStopTyping");
  //   });
  
  //   socket.on("chat message", function(msg) {  
  //     socket.broadcast.emit("received", { message: msg });
  //   });
  // });
})
http.listen(3000, () => {
    console.log("Running on Port: 3000");
});


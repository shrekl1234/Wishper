require("dotenv").config();
// const bcrypt = require("bcrypt"); //For Salting password
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate")
// const saltNumber = 10;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret:"This is my secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/wisperDB");
// mongoose.set("userCreateIndex",true);

// Defining Schema And model of User Start
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
// Defining Schema And model of User Ends

// Home Section Starts
app.get("/", function(req, res) {
  res.render("home");
});
// Home Section Ends
//google Start
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

//google end
// secret Section Starts
app.get("/secret", function(req, res) {

    if (req.isAuthenticated()) {
      res.render("secrets");
    } else {
      res.render("login")
    }


});
// secret Section Ends


// Login Section Start
app.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res) {
     const user = new User({
       username: req.body.username,
       password: req.body.password
     });

     req.login(user,function(err){
       if (err) {
         console.log(err);
         res.redirect("/login")
       } else {
         passport.authenticate("local")(req,res,function(){
           res.redirect("/secret")
         });
       }
     });
  });
// Login Section Ends

// Registration Section Start
app.route("/register")
  .get(function(req, res) {
    res.render("register");
  })
  .post(function(req, res) {
   User.register({username: req.body.username}, req.body.password, function(err, user){
     if (err) {
       console.log(err);
       res.redirect("/register");
     } else {
       passport.authenticate("local")(req,res,function(){
         res.redirect("/secret")
       });
     }
   });

  });
// Registration Section Ends

//Logout Section Starts
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});
//Logout Section Ends


// Server Started
app.listen(2000, function(req, res) {
  console.log("Server Started at port 3000");
});

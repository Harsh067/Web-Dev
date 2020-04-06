require('dotenv').config();
const ejs = require('ejs');
const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const md5 = require("md5");
// const bcrypt = require('bcrypt');

// const saltRounds = 15;
// const encrypt = require('mongoose-encryption');

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({
    secret: "MySecret",
    resave: false,
    saveUninitialized: false

}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
// console.log(process.env.SECRET);

// const secret = "Mysecret1."
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });     -->Used with mongoose-encryption

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser()); //All 3 used through passport-local-mongoose
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
        clientID: process.env.CLEINT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/Secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleID: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function(req, res) {
    res.render("home")
});

app.get("/login", function(req, res) {
    res.render("login")
});

app.get("/register", function(req, res) {
    res.render("register")
});

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect('/');
})

/*--------------------------------------------------------------------------------------------------------------------------------------------------------POST functions--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

app.post("/register", function(req, res) {
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
            if (err) {
                console.log(err);
                res.redirect('/register')
            } else {
                passport.authenticate('local')(req, res, function() {
                    res.redirect('/secrets');
                })
            }
        })
        // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        //     const newUser = new User({
        //         email: req.body.username,
        //         password: hash
        //     });
        //     newUser.save(function(err) {
        //         if (err) {
        //             res.send(err);
        //         } else {
        //             res.render("secrets");
        //         }
        //     })

    // })


})

app.post("/login", function(req, res) {
    const newuser = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(newuser, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/secrets');
            })
        }
    })

    // const username = req.body.username;
    // const password = req.body.password;
    // User.findOne({ email: username }, function(err, foundUser) {
    //     if (err) {
    //         res.send(err)
    //     } else {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 if (result == true) {
    //                     res.render("secrets");
    //                 } else {
    //                     res.send("Wrong password.");
    //                     console.log(password);
    //                     console.log(foundUser.password);
    //                 }
    //             });

    //         }
    //     }
    // });
});




app.listen(3000, function() {
    console.log("Server started at 3000");
})
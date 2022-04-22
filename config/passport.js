var Localstrategy =require('passport-local').Strategy;
var User = require('../models/user'); //model ta tự tạo
var bcrypt = require('bcryptjs'); // modun phải cài
// var passport = require('passport')
module.exports = function (passport) {
    passport.use(new Localstrategy(function (username, password, done) {
        User.findOne({ username: username }, function (err, user) {
        if (err) { console.log(err); }
        if (!user) { 
             return done(null, false);
        }
        bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) { console.log(err); }
        if (isMatch) {
            return done(null, user);
            } else {
            return done(null, false, { message: 'Wrong password.' });
            }
        });
    });
}));
passport.serializeUser (function (user, done) {
done (null, user.id)
});
passport.deserializeUser (function (id, done) {
    User.findById(id, function (err, user) {
        done (err, user);
    });
    });
}

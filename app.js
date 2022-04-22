var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require("express-session")
var fileUpload = require("express-fileupload")
var passport = require("passport");
require('./config/passport')(passport);
// //passport 
//passport
var app = express();
// GET PAGE MODEL
var Page = require("./models/page");
// Lấy hết page và truyền vào header.ejs
Page.find(function (err, pages) {
  if (err) console.log(err);
  else {
    app.locals.pages = pages;
  }
});
// get Category model
var Category = require("./models/category")
// Lấy hết categories và truyền vào header.ejs
Category.find(function (err, categories) {
  if (err) console.log(err);
  else {
    // tạo biến toàn cục categories để truyền qua Lại giữa và view, route khác
    app.locals.categories = categories;
  }
});
//express-messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
//middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// require express-session
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))
// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.locals.errors = null;

// ket noi den csdl mongodb
const config = require("./config/database")
const mongoose = require("mongoose");
mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("ket noi thanh cong")
});

app.use(passport.initialize());
app.use(passport.session());
app.get('*', function (req, res, next) {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});
// Route Admin
app.use('/admin/pages', require('./routes/admin_pages'));
app.use('/admin/products', require("./routes/admin_products"));
app.use('/admin/categories', require('./routes/admin_categories'));
// Route Client
app.use('/users', require("./routes/users"));
app.use('/products', require("./routes/products"));
app.use('/cart', require("./routes/cart"));
app.use('/', require("./routes/pages"));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  if (!req.user) return next(createError(401, 'Please login to view this page.'))
  next()
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Our app is running on port ${PORT}`);
});
module.exports = app;

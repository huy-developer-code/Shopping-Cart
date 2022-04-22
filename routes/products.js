const express = require('express')
const router = express.Router()
var fs = require("fs-extra")
var auth = require("../config/auth");
var isUser = auth.isUser; 

//Get Product model
var Product = require("../models/product");
var Category = require("../models/category")
/* GET all product. */
router.get("/",isUser, function(req, res, next) {
  Product.find(function(err, products) {
    if(err)console.log(err);
    res.render("all_products", { title: 'All product', products });
  });
});
/* GET products by category */
router.get("/:category", function(req, res, next) {
  var categorySlug = req.params.category;
  Category.findOne({ slug: categorySlug }, function(err, c) {
    Product.find({ category: categorySlug }, function(err, products) {
      if(err) console.log(err);
      res.render("cat_products", { title: c.title, products});
    });
  });
});
/* GET product details */
router.get("/:category/:product", function (req, res, next) {
  var galleryImages = null;
  var loggedIn = (req.isAuthenticated()) ? true : false;
  Product.findOne({ slug: req.params.product }, function(err, product) {
    if (err) console.log(err);
    else {
      var galleryDir = 'public/product_images/' + product.id + '/gallery';
      fs.readdir(galleryDir, function(err, files) {
        if(err) console.log(err);
        else {
          galleryImages = files;
          res.render('product', { title:product.title, p:product, galleryImages, loggedIn});
        }
      });
    }
  });
});
module.exports = router
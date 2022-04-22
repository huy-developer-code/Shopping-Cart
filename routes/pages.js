var express = require('express');
var router = express.Router();
//Get Page model
var Page = require("../models/page");
/* GET users listing. */
/* GET home page. */
router.get("/", function (req, res, next) {
 Page.find({ slug: 'home' }, function (err, page) {
    if (err)
      console.log(err);
    res.render("index", { title: page.title, content: page.content });
  });
});
/* GET a page. */
router.get("/:slug", function (req, res, next) {
  var slug = req.params.slug;
  Page.findOne({ slug: slug }, function (err, page) {
    if (err)
     console.log(err);
   if (!page) {
     res.redirect('/');
   }
   else {
     res.render("index",{title: page.title, content: page.content});
   }
});
});

module.exports = router;

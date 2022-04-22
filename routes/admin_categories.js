var express = require('express');
var router = express.Router();
var Category = require('../models/category');  
var auth =  require("../config/auth");
var isAdmin = auth.isAdmin;


var { check,validationResult } = require('express-validator');
// lay model Category da tao qua su dung
router.get("/", isAdmin, function(req,res,next){
    Category.find(function(err,categories){
      if (err) return console.log(err);
      res.render('admin/categories',{categories});
    });
  });
// get add category
router.get("/add-category",isAdmin ,function(req,res,next){
    var title = "";
    res.render('admin/add_category',{title});
  });
// post add-category
router.post("/add-category",[
  check('title','Title mus have a value.').notEmpty()
],
  function (req, res, next) {
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    const errors = validationResult(req).errors;
    if (errors.length != 0) {
      cosole.log('có lỗi')
      res.render('admin/add_category', { title, errors });
      // truyền error, title vao ejs
    } else {
      Category.findOne({ slug }, function (err, category) {
        if (category) {
          req.flash('danger', 'Category title exists,choose another');
          res.render('admin/add_category', { title });
        } else {
          //truền dữ liệu từ form vào model Page
          var category = new Category({ title, slug });
          //luu vào model category vao csdk mongo
          category.save(function (err) {
            if (err) return console.log(err);
            Category.find(function (err, categories) {
              if (err) return console.log(err)
              else {
                req.app.locals.categories = categories
              };
            });
            // hiện thông báo cho biết chèn dữ liệu thành công
            req.flash('success', 'Category added');
            // sau khi chèn thành công thì điều hướng về /admin/pages
            res.redirect('/admin/categories');
          });
        }
      })
    }
  })
//get edit category
router.get("/edit-category/:id",isAdmin,function( req , res ,next){
  Category.findById(req.params.id, function (err,category){
    if (err)
      return console.log(err);
      res.render('admin/edit_category',{
      title: category.title,
      id: category._id
    });
  });
});
// tao tuyen post cho edit
router.post("/edit-category/:id",[
    check('title','Title must have a value.').notEmpty(),
  ],function (req, res, next ){
      var title = req.body.title;
      var slug = title.replace(/\s + /g, '-').toLowerCase();
      var id = req.params.id;
      //id tu form
      const errors = validationResult(req).errors;
      if (errors.length != 0){
        //co lỗi thì quay về chính trang để edit  
        res.render('admin/edit_category',{errors , title , id });
      }
      else{
        Category.findOne( { slug: slug, _id: { '$ne' : id } }, function(err,category){
          if (category){
            // hien thi thông báo có lỗi chèn trùng
            req.flash('danger','Page slug exists, choose another.');
            req.render('admin/add_category',{title, id});
          } else {
              Category.findById(id ,function(err,category){
              if(err) 
                return console.log(err);
                category.title = title;
                category.slug = slug;
              //Lưu model category vào csdl mongo
              category.save(function(err){
                if (err)
                  return console.log(err);
                Category.find(function (err, categories) {
                  if (err) return console.log(err)
                  else {
                    req.app.locals.categories = categories
                };
              })
            //hiện thông báo cho biết chèn dữ liệu thành công
            req.flash('success','Category edited');
            //sau khi chèn thành công thì đièuu hướng về
            // res.redirect('/admin/categories/edit-category/' + id);
            res.render('admin/categories', { categories });
            });
          });
      }
    });
  }
});
// Delete
router.get("/delete-category/:id",isAdmin,function(req,res,next){
  Category.findByIdAndRemove(req.params.id,function(err){
    if (err)
      return console.log(err);
    Category.find(function (err, categories) {
      if(err) console.log(err)
      else {
        req.app.locals.categories = categories
      }
    })
    req.flash('success', 'Category deleted!');
    // res.redirect('/products')
    //sau khi xoa thanh cong thi dieu huong ve /admin/categories
    res.redirect('/admin/categories');
  });
});

module.exports = router;
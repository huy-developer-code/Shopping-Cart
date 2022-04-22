var express = require('express');
var router = express.Router();
var Page = require('../models/page');
var { check, validationResult } = require('express-validator')
var auth =  require("../config/auth");
var isAdmin = auth.isAdmin;

/* GET admin page. */
router.get("/",isAdmin, function(req, res, next) {
  Page.find({}).exec(function(err,pages){
    res.render('admin/pages',{pages});
  });
});
// get add page
router.get("/add-page",isAdmin,function(req,res,next){
  var title = "";
  var slug ="";
  var content=""; 
  res.render('admin/add_page',{title, slug, content});
});
// Post add page
router.post("/add-page",[
  check('title','Title must have a value.').notEmpty(),
  check('content','Content must have a value.').notEmpty() 
],    
  function (req, res, next ){
    var title = req.body.title;
    var content = req.body.content;
    var slug = req.body.slug.replace(/\s+/g,'-').toLowerCase();
    if (slug == "") slug = title.replace(/\s+/g,'-').toLowerCase();
    const errors = validationResult(req).errors;
    if (errors.length != 0){
      res.render('admin/add_page',{errors,title,slug,content});
    }
    else{
      console.log('chuyen du liễu từ form vào database');
      Page.findOne({slug: slug},function(err,page){
        if (page){
          // hien thi thông báo có lỗi chèn trùng
          req.flash('danger','Page slug exists, choose another.');
          req.render('index',{title,slug,content});
          } else {
          //truyền dữ liệu từ form vào model Page
          var page = new Page({title, slug,content,sorting:100});
          //Lưu model page vào csdl mongo
          page.save(function(err){
            if (err)
              return console.log(err);
            Page.find({}).sort({sorting:1}).exec(function(err,pages){
              if (err)
              {
                console.log(err);
              }
              else
              {
                req.app.locals.pages = pages;
              }
              });
            //hiện thông báo cho biết chèn dữ liệu thành công
            req.flash('success','Page added');
            //sau khi chèn thành công thì đièuu hướng về /admin/pages
            res.redirect('/admin/pages');
            });
          }
        });
      }
    });
// get edit page
router.get("/edit-page/:id",isAdmin,function(req,res,next){
  Page.findById(req.params.id,function(err,page){
    if(err) 
      return console.log(err);

      res.render('admin/edit_page',{
        title: page.title,
        slug:page.slug,
        content:page.content,
        id: page._id
      });
  });
});    
  // Giai doan 8 tao tuyen POST cho page trong admin_page.js
router.post("/edit-page/:id",[
    check('title','Title must have a value.').notEmpty(),
    check('content','Content must have a value.').notEmpty() 
  ], function (req, res, next ){
    var title = req.body.title;
    var content = req.body.content;
    var id =req.params.id;
    var slug = req.body.slug.replace(/\s+/g,'-').toLowerCase();
    if (slug == "") slug = title.replace(/\s+/g,'-').toLowerCase();
    const errors = validationResult(req).errors;
    if (errors.length != 0){
      //có lỗi thì quay về chính trang edit nhập lại cho đúng
      res.render('admin/edit_page',{errors,title,slug,content,id});
    }
    else{
      console.log('cập nhật dữ liệu từ form vào database');
      Page.findOne({slug: slug,_id:{'$ne':id}},function(err,page){
        if (page){
          // hien thi thông báo có lỗi chèn trùng
          req.flash('danger','Page slug exists, choose another.');
          req.render('admin/edit_page',{title,slug,content,id});
        } else {
          Page.findById(id, function (err, page) {
            if (err) 
            return console.log(err);
            page.title = title;
            page.slug = slug;
            page.content = content;
          // });
          //Cập nhât lại document trong database với id tương ứng
          page.save(function(err){
            if (err)
              return console.log(err);
              req.flash('success','Paged update!');
            //sau khi cập nhật thành công
            res.redirect('/admin/pages/edit-page/' + id);
            });
          });
          }
        });
      }
    });
// get delete page
router.get("/delete-page/:id",isAdmin,function(req,res,next){
  Page.findByIdAndRemove(req.params.id,function(err){
    if (err)
      return console.log(err);
    // Lấy hết page và truyền vào header.ejs
    Page.find(function (err, pages)
    {
      if (err)
        console.log(err);
      else
      {
        req.app.locals.pages = pages;
      }
    });
    req.flash('success','Page deleted!');
    //sau khi xoa thanh cong thi dieu huong ve /admin/pages
    res.redirect('/admin/pages');
  });
});
module.exports = router;

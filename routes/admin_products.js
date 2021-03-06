var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var Category = require('../models/category');
var mkdirp = require('mkdirp');
var path = require('path');
const { check, validationResult } = require('express-validator');
var auth =  require("../config/auth");
var isAdmin = auth.isAdmin;

var fs = require('fs-extra');
var resizeImg = require('resize-img');
//get Product,category model

// GET PRODUCT INDEX
router.get("/",isAdmin,function( req , res , next){
     var count;
     Product.countDocuments(function(err,c){
         count = c;
     });
     Product.find(function(err,products){
         res.render('admin/products',{ products, count});
     });
 });

//ROUTE GET add product
router.get('/add-product',isAdmin,function( req , res ,next ){
    var title ="";
    var desc ="";
    var price = "";
    Category.find(function (err,categories){
    res.render('admin/add_product',{title , desc , categories , price});                    
    }) ;
});
// hàm kiểm tra có phải ảnh hợp lệ hay không?
function isImage(value , { req }){
    var filename = req.files !== null ? req.files.image.name :'';
    var extension = (path.extname(filename)).toLowerCase();
    switch(extension){
        case '.jpg':return '.jpg';
        case '.png':return '.png';
        case '.jpeg':return '.jpeg';
        case '' :return '.jpg';
        default: return false;
    }
}
//liệt kê các kiểm tra hơp lệ trên form trước khi cho submit
const isValidator = [
    check('title','Title must have a value.').notEmpty(),
    check('desc','Description must have a value.').notEmpty(),
    check('price','Price must have a value.').isDecimal(),
    check('image','You must upload an image.').custom(isImage),
];
//Post add product
router.post("/add-product",isValidator,
    function (req , res , next){
        var title = req.body.title;
        var slug = title.replace(/\s+/g,'-').toLowerCase();
        var desc = req.body.desc;
        var price = req.body.price;
        var category = req.body.category;
        var image = req.files !== null ? req.files.image.name :'';

        const errors = validationResult(req).errors;

        if (errors.length != 0){
            Category.findOne(function (err,categories){
                res.render('admin/add_product',{errors ,title, desc, categories , price});
            });
        }
        else{
            Product.findOne({slug : slug} , function(err,products){
                if (product)  {
                req.flash('danger','Product title exists, choose another');
                Category.findOne(function( err , categories){
                    res.render('admin/add_product', { title, desc, categories, price})
                    }); 
                } else {
                    var price2 = parseFloat(price).toFixed(2);
                    //truyền dữ liệu từ form vào model Product
                    var product = new Product({ title, slug , desc , category,  price: price2 , image});
                    // Lưu model product vao csdl mongo
                    product.save(function(err){
                        if (err)
                            return console.log(err);
                        var mypath = 'public/product_images/' + product._id;
                        mkdirp.sync(mypath + '/gallery/thumbs');
                        if (image != '') {
                            var productImage = req.files.image;
                            var tmp = mypath + '/' + image;
                            productImage.mv(tmp , function(err){
                                if (err) return console.log(err);
                            })
                            // hiện thông báo cho biết chèn dữ liệu thành công
                            req.flash('success', 'Product added!');
                            res.redirect('/admin/products/');
                        }
                    });
                }
            });
        };
    });
// * GET delete product. */
router.get("/delete-product/:id",isAdmin, function (req, res, next) {
    var id = req.params.id;
    var mypath = 'public/product_images/' + id;
    fs.remove(mypath, function (err) {
    if (err) console.log(err);
    else {
        Product.findByIdAndRemove(id,function (err) { console.log(err); });
        req.flash('success', 'Product deleted!');
        res.redirect('/admin/products/');
 }
});
});
//GET EDIT
router.get("/edit-product/:id",isAdmin, function (req, res, next) {
    var errors;
    if (req.session.errors) errors = req.session.errors;
    req.session.errors = null;
    Category.find(function (err, categories) {
        Product.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('/admin/products');
            }
            else {
                var galleryDir = 'public/product_images/' + p._id + '/gallery';
                var galleryImages = null;
                fs.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;
                        res.render('admin/edit_product',
                            {
                                // nguyên đồng dữ liệu này sẽ được truyền qua view admin/edit_product
                                title: p.title,
                                errors: errors,
                                desc: p.desc,
                                categories: categories,
                                category: p.category.replace(/\s+/g, '-').toLowerCase(),
                                price: parseFloat(p.price).toFixed(2),
                                image: p.image,
                                galleryImages: galleryImages,
                                id: p._id
                            }
                        );
                    }
                });
            }
        });
    });
});
// PPOST PRODUCT-GALLERY
router.post("/product-gallery/:id",
    function (req, res, next) {
        var productImage = req.files.file;
        var id = req.params.id;
        var mypath = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
        var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;
        productImage.mv(mypath, function (err){
            if (err) console.log(err);
        // giảm kích thước file đã Lưu trong gallery thành dài=100 và rộng=100, và Lưu vào thư mục thumb để tạo thumbnails,ta dùng plugin resize-img đã cài đặt Lúc đầu
            // (async () => {
                
            // })
            resizeImg(fs.readFileSync(mypath), { width: 100, height: 100 }).then(function(buf) {
                    fs.writeFileSync(thumbsPath, buf);
                });
        })
        res.sendStatus(200);
    })
// POST edit product. /
router.post("/edit-product/:id", isValidator,
    function (req, res, next) {
        var title = req.body.title;
        var slug = title.replace(/\s+/g, '-').toLowerCase();
        var desc = req.body.desc;
        var price = req.body.price;
        var category = req.body.category;
        var pimage = req.body.pimage;
        var id = req.params.id;
        var imageFile = req.files !== null ? req.files.image.name : "";
          
        const errors = validationResult(req).errors;
        if (errors.length != 0) {
            req.session.errors = errors;
            res.redirect('/admin/products/edit-product/' + id);
        } else {
            Product.findOne({ slug: slug, _id: { '$ne': id } }, function (err, p) {
                if (err)
                    console.log(err);
                if (p) {
                    req.flash('danger', 'Product title exists, choose another.');
                    res.redirect('/admin/products/edit-product/' + id);
                } else {
                    Product.findById(id, function (err, p) {
                        if (err)
                            console.log(err);
                        p.title = title;
                        p.slug = slug;
                        p.desc = desc;
                        p.price =
                            p.category = category;
                        p.price = parseFloat(price).toFixed(2);
                        if (imageFile != '')
                        {
                            p.image = imageFile;
                        }
                        p.save(function (err) {
                            if (err) console.log(err);
                            if (imageFile != '') {
                                if (pimage != '') {
                                    //  I/ xóa ảnh cũ (nếu có) để cập nhật ảnh mới
                                    fs.remove('public/product_images/' + id + '/' + pimage,
                                        function (err) { if (err) console.log(err); });
                                }
                                var productImage = req.files.image;
                                var tmp = "public/product_images/" + id + '/' + imageFile;
                                productImage.mv(tmp, function (err) {
                                    if (err)
                                        return console.log(err);
                                });
                            }
                            // hiện thông báo cho biết cập nhật thành công
                            req.flash('success', 'Product updated!');
                            // quay về chính trang updated để xem coi có cập nhật gì nữa không ?
                            res.redirect('/admin/products/edit-product/' + id);
                            // edit
                            });
                    });
                }
            });
        }
    }
)
/* GET delete image. */
router.get("/delete-image/:image",isAdmin, function (req, res, next) {
  var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
  var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;
  fs.remove(originalImage, function(err) {
      if(err) console.log(err);
      else {
          fs.remove(thumbImage, function (err) {
              if(err) console.log(err);
              else {
                  req.flash('success', 'Image deleted!');
                  res.redirect('/admin/products/edit-product/' + req.query.id);
              }
          });
      }
  });
});
 module.exports = router;
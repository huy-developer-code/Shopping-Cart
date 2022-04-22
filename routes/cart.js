var express = require('express')
var router = express.Router()
var Product = require("../models/product")
var Page = require("../models/page");
/* GET users listing. */
/* GET home page. */
router.get("/", function (req, res, next) {
  Page.find({ slug: 'home' }, function (err, page) {
    if (err)
      console.log(err);
    res.render("index", { title: page.title, content: page.content });
  });
})

///////////////////////////////
/* GET checkout page */
router.get("/checkout", function (req, res, next) {
  if (req.session.cart && req.session.cart.length == 0) {  
    // nếu hết hàng trong giỏ thì xóa biến session
    delete req.session.cart;
    res.redirect('/cart/checkout');
   } else {
    res.render('checkout', {
      title: 'Checkout',
      cart: req.session.cart
    });
  }
});
/* GET add product to cart */
router.get("/add/:product", function (req, res, next) {
  var slug = req.params.product;
  Product.findOne({ slug }, function (err, p) {
    if (err) console.log(err);
    if (typeof req.session.cart === "undefined") {
      // nếu giỏ hàng rỗng thì khởi tạo mới
      req.session.cart =[]; // khởi tạo mảng
      // thêm hàng vào giỏ hàng
      req.session.cart.push({
        title: slug,
        qty: 1, // số Lượng
        price: parseFloat(p.price).toFixed (2),
        image: '/product_images/' + p._id + '/' + p.image
      });
    } else {
    // nếu có hàng trong giỏ thì thêm vô nữa
    var cart = req.session.cart;
    var newItem = true;
    for (var i = 0; i < cart.length; i++) {
    if (cart[i].title == slug) { //nếu hàng đã có thì tăng số Lượng thôi
    cart[i].qty++;
    newItem = false; // đánh dấu không phải là hàng mới
    break;
    }}
    // nếu hàng mới thì thêm vô giỏ hàng (đang có hàng)
    if (newItem) {
    cart.push({
    title: slug,
    qty: 1,
    price: parseFloat(p.price).toFixed(2),
    image: '/product_images/' + p._id + '/' + p.image
    });
    }}
    console.log(req.session.cart);
    req.flash('success', 'Product added!');
    res.redirect('back');
});
}); 
 /* GET update product */
router.get("/update/:product", function (req, res, next) {
  var slug = req.params.product;
  var cart = req.session.cart;
  var action=req.query.action;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].title == slug) {
      switch (action) {
        case "add": cart[i].qty++; break;
        case "remove": cart[i].qty--
        if (cart[i].qty < 1) // xóa product nếu số lượng < 1
          cart.splice (i, 1);
        break;
        case "clear":
          cart.splice(i, 1);
          if (cart.length == 0) delete req.session.cart;
          break;
      default:console.log('update problem'); break;
    }
    break;
    }
  }
req.flash('success', 'Cart updated!');
res.redirect('/cart/checkout'); // tiếp tục quay lại giỏ hàng
}); 
 /* GET clear cart */
router.get("/clear", function (req, res, next) {
delete req.session.cart;
req.flash('success', 'Cart cleared!');
res.redirect('back');
});
router.get('/buynow', function (req, res) {
delete req.session.cart;
res.sendStatus(200);
});
module.exports = router
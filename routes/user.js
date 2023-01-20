var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helper");
const veryfyLogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCArtCount(req.session.user._id);
  }
  productHelpers.getAllProducts().then((products) => {
    res.render("user/user-view", { admin: false, products, user, cartCount });
  });
});
router.get("/login", (req, res) => {
  if (req.session.userloggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginERR: req.session.userloginErr });
    req.session.userloginErr = false;
  }
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});
router.post("/signup", (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.userloggedIn = true;
    req.session.user = response;
    res.redirect("/");
  });
});

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
     
      req.session.user = response.user;
      req.session.userloggedIn = true;
      res.redirect("/");
    } else {
      req.session.userloginErr = "Invalid User Name and Password";

      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.user=null
  req.session.userloggedIn=false
  res.redirect("/");
});

router.get("/cart", veryfyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id);
  totalValue=0
  if(products.length>0){
     totalValue= await userHelpers.getTotalAmount(req.session.user._id)
  }
  
  console.log(products);
  res.render("user/cart", { products, user: req.session.user,totalValue });
});

router.get("/add-to-cart/:id", (req, res) => {
  console.log("api call");
  userHelpers.addTocart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});
router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
   response.total= await userHelpers.getTotalAmount(req.body.user)
     res.json(response)
  })
});
router.get('/place-order',veryfyLogin,async(req,res)=>{
  let total= await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
});

router.post('/place-order',async(req,res)=>{
 
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((oderId)=>{
    console.log(oderId);
    if(req.body['payment-method']==='COD'){
    res.json({codSuccess:true})
    }else{
      userHelpers.genarateRazorpay(oderId,totalPrice).then((response)=>{
         res.json(response)
      })
    }
   
  })
});

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
});
router.get('/orders',async(req,res)=>{
  let orders=await userHelpers.getUserOrder(req.session.user._id)
 
  res.render('user/orders',{user:req.session.user,orders})
});
router.get('/view-order-products/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products})
})

router.post('/verify-payment',(req,res)=>{
  console.log('post details',req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body.order.receipt).then(()=>{
      console.log('payment successful');
      res.json({status:true})
    })
  }).catch((err)=>{
   console.log(err);
   res.json({status:false,errMsg:''})
  })
})
module.exports = router;

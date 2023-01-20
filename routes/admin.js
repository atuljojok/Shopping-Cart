var express = require('express');
const { response } = require('../app');
const { addProduct } = require('../helpers/product-helpers');
var router = express.Router();
const productHelpers=require('../helpers/product-helpers')


/* GET users listing. */
router.get('/', function(req, res, next) {
 productHelpers.getAllProducts().then((products)=>{
   console.log(products);
  res.render('admin/view-products',{products,admin:true})
 })
  
 
});

router.get('/add-product',function(req,res){
  
  res.render('admin/add-product',{admin:true})
});

router.post('/add-product',(req,res)=>{

  productHelpers.addProduct(req.body,(id)=>{
    let image= req.files.Image

    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      
      if(!err){
        res.render('admin/add-product')
      }else{
        console.log(err);
      }
    })
  })
});
router.get('/delete-product/:id',(req,res)=>{ 
 let proID=req.params.id
 console.log(proID);
 productHelpers.deleteProduct(proID).then((response)=>{
  res.redirect('/admin/')
 })
});

router.get('/edit-product/:id',async(req,res)=>{
  let product= await productHelpers.getProductDetails(req.params.id)
    console.log(product);
  res.render('admin/edit-product',{product})
});

router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
 productHelpers.updateProduct(req.params.id,req.body).then(()=>{
  res.redirect('/admin')
  if(req.files.Image){
    let image=req.files.Image
    image.mv('./public/product-images/'+id+'.jpg')
    
  }
 })
})

module.exports = router;

var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
const objectID=require('mongodb').ObjectId
const Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_ZdONrcdecrhjHq',
    key_secret: 'Oemt7BgOihhnoiaOmeDSAnRD',
  });

module.exports={
    doSignup:(userData)=>{
       return new Promise(async(resolve,reject)=>{
        userData.Password=await bcrypt.hash(userData.Password,10)
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
            resolve(data.insertedID)
        })
       })
    },
    doLogin:(userData)=>{
       return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
         if(user){
            bcrypt.compare(userData.Password,user.Password).then((status)=>{
             if(status){
                console.log("login success");
                response.status=true
                response.user=user
                resolve(response)
             }else{
                console.log('login failed');
                resolve({status:false})
            }
           })
        }else{
            console.log('login failed');
            resolve({staus:false})
        }
       })
    },
    addTocart:(proID,userID)=>{
        let proObj={
            item:objectID(proID),
            quantity:1
        }
       return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectID(userID)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item==proID)
            console.log(proExist);
            if(proExist!=-1){
              db.get().collection(collection.CART_COLLECTION)
              .updateOne({ user:objectID(userID),'products.item':objectID(proID)},
              {
                $inc:{'products.$.quantity':1}
              }
              )
              .then(()=>{
                resolve()
              })
             }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectID(userID)},
                {
                  
                        $push:{products:proObj}
                    
                }).then((response)=>{
                    resolve(response)
                })
           }
        }else{
            let cartObj={
                user:objectID(userID),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve(response)
            })
        }
      })
    },
    
   getCartProducts:(userID)=>{
    return new Promise(async(resolve,reject)=>{
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectID(userID)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
           
                
            
        ]).toArray()
        
        resolve(cartItems)
    })
   },
   getCArtCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
        let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectID(userId)})
        if(cart){
            count=cart.products.length
        }
        resolve(count)
    })
   },
   changeProductQuantity:(details)=>{
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
   
    return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectID(details.cart)},
        {
            $pull:{products:{item:objectID(details.product)}}
        }
        ).then((response)=>{
            resolve({removeProduct:true})
        })
    }else{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectID(details.cart),'products.item':objectID(details.product)},
        {
            $inc:{'products.$.quantity':details.count}
        }
        ).then((response)=>{
            resolve({status:true})
        })
    }
    })
   },
   getTotalAmount:(userID)=>{
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectID(userID)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            },
            {
                $group:{
                    _id:null,
                    total:{$sum:{$multiply:['$quantity',{ $convert: { input:'$product.Price', to: "int" } }]}}
                }
            }
           
                
            
        ]).toArray()
       //console.log(total[0].total);
       resolve(total[0].total)
    })
   },
   placeOrder:(order,products,total)=>{
    console.log(order);
    return new Promise((resolve,reject)=>{
     let status=order['payment-method']==='COD'?'placed':'pending'
     let oderObj={
        deliveryDetails:{
            mobile:order.mobile,
            adress:order.adress,
            pincode:order.pincode,

        },
        userId:objectID(order.userId),
        paymentMethod:order['payment-method'],
        products:products,
        totalAmount:total,
        status:status,
        date:new Date()
     }
     db.get().collection(collection.ORDER_COLLECTION).insertOne(oderObj).then((response)=>{
       db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectID(order.userId)})
        console.log('oderId:',response);
        resolve(response.insertedId)
     })
    })

   },
   getCartProductList:(userId)=>{
   
    return new Promise(async(resolve,reject)=>{
        let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectID(userId)})
      
        resolve(cart.products)
    })
   },
   getUserOrder:(userID)=>{
    console.log(userID);
    return new Promise(async(resolve,reject)=>{
        let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectID(userID)}).toArray()
           
        resolve(orders)
    })
   },
   getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{_id:objectID(orderId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
           
                
            
        ]).toArray()
      // console.log(orderItems);
         resolve(orderItems)
    })
   },
   genarateRazorpay:(oderId,total)=>{
    console.log(oderId);
    return new Promise((resolve,reject)=>{
        var options={
            amount: total,
            currency: "INR",
            receipt: ''+oderId,
        }
        instance.orders.create(options,(err,order)=>{
            if(err){
                console.log(err);
            }else{
                console.log(' New order:',order);
                resolve(order)
            }
    
        })
      
    })
   },
   verifyPayment:(details)=>{
    console.log('oder detials',details);
    return new Promise((resolve,reject)=>{
        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256','Oemt7BgOihhnoiaOmeDSAnRD')
        hmac.update(details.payment.razorpay_order_id+'|'+details.payment.razorpay_payment_id)
        hmac=hmac.digest('hex')
        if(hmac==details.payment.razorpay_signature){
          resolve()
        }else{
            reject()
        }
    })
   },
   changePaymentStatus:(oderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).update({_id:objectID(oderId)},
        {
            $set:{
                status:'placed'
            }
        }).then(()=>{
            resolve()
        })
    })
   }
  
 }
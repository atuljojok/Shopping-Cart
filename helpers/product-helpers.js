var db=require('../config/connection')
var collection=require('../config/collections');
const { response } = require('../app');
var objectID=require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback)=>{
       
        
       db.get().collection('product').insertOne(product).then((data)=>{
        console.log(data);
          
          callback(data.insertedId)
       })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectID(proID)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(proID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectID(proID)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proID,proDetials)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectID(proID)},
            {$set:{
                Name:proDetials.Name,
                Discription:proDetials.Discription,
                Category:proDetials.Category,
                Price:proDetials.Price
            }}).then((response)=>{
                resolve(response)
            })
        })
    }
}
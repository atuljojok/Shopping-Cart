

function addTocart(proID){
    console.log(proID);
    $.ajax({
        url:'/add-to-cart/'+proID,
        method:'get',
        success:(response)=>{
           
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
                console.log(count);
            }
            
        }
    })
}


import {admin,body,db,fail,handler} from '../lib/server.mjs';
import {customer,uuid,limited} from '../lib/customer.mjs';
export default handler(async(req,res)=>{
 if(req.method==='GET'){
  if(req.query.admin==='1'){await admin(req);res.json(await db('product_reviews?select=*&order=created_at.desc&limit=200'));return;}
  if(!uuid(req.query.product))fail(400,'Choose a product.');
  res.json(await db('product_reviews?product_id=eq.'+req.query.product+'&status=eq.approved&select=id,display_name,rating,comment,created_at&order=created_at.desc&limit=100'));return;
 }
 const b=body(req);
 if(req.method==='PATCH'){await admin(req);if(!uuid(b.id)||!['approved','rejected'].includes(b.status))fail(400,'Choose a valid review action.');res.json(await db('product_reviews?id=eq.'+b.id,{method:'PATCH',body:JSON.stringify({status:b.status})}));return;}
 if(req.method!=='POST')fail(405,'Method not allowed.');const user=await customer(req);await limited(req,'review:');
 if(!uuid(b.product_id)||!uuid(b.order_id)||!Number.isInteger(b.rating)||b.rating<1||b.rating>5||typeof b.display_name!=='string'||b.display_name.trim().length<2||b.display_name.length>60||typeof b.comment!=='string'||b.comment.trim().length<10||b.comment.length>2000)fail(400,'Add your name, rating and a review of at least 10 characters.');
 const orders=await db('orders?id=eq.'+b.order_id+'&email=ilike.'+encodeURIComponent(user.email.replace(/\\/g,'\\\\').replace(/[%_]/g,v=>'\\'+v).replaceAll('*','\\%'))+'&payment_status=eq.paid&fulfillment_status=eq.completed&select=id,order_items(product_id)');
 if(!orders[0]?.order_items?.some(i=>i.product_id===b.product_id))fail(403,'Reviews open after your paid order has been completed.');
 if((await db('product_reviews?order_id=eq.'+b.order_id+'&product_id=eq.'+b.product_id+'&select=id')).length)fail(409,'You have already reviewed this purchase.');
 await db('product_reviews',{method:'POST',body:JSON.stringify({user_id:user.id,order_id:b.order_id,product_id:b.product_id,rating:b.rating,display_name:b.display_name.trim(),comment:b.comment.trim()})});res.json({submitted:true,message:'Thank you. Your verified-purchase review has been submitted for publication.'});
});

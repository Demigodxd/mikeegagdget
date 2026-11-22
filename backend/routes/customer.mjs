import {body,db,fail,handler} from '../lib/server.mjs';
import {customer,cleanState,limited} from '../lib/customer.mjs';
export default handler(async(req,res)=>{
 const user=await customer(req);const path='customer_preferences?user_id=eq.'+user.id+'&select=state,revision';
 if(req.method==='GET'){
  const preferences=(await db(path))[0]||{state:{saved:[],cart:[],addresses:[]},revision:0};
  const email=encodeURIComponent(user.email.replace(/\\/g,'\\\\').replace(/[%_]/g,v=>'\\'+v).replaceAll('*','\\%'));
  const orders=await db('orders?email=ilike.'+email+'&select=id,paystack_reference,total_kobo,payment_status,fulfillment_status,created_at,order_items(product_id,product_name,quantity),order_delivery_updates(estimated_date,carrier,tracking_number,customer_note)&order=created_at.desc&limit=100');
  res.json({...preferences,orders,email:user.email});return;
 }
 if(req.method!=='PUT')fail(405,'Method not allowed.');await limited(req,'account:');const b=body(req);
 if(!Number.isInteger(b.revision)||b.revision<0)fail(400,'Reload your account before saving.');
 const current=(await db(path))[0];if((current?.revision||0)!==b.revision)fail(409,'Your account changed on another device. Reload it before saving.');
 res.json(await db('rpc/save_customer_preferences',{method:'POST',body:JSON.stringify({p_user:user.id,p_state:cleanState(b.state),p_revision:b.revision})}));
});

import {randomBytes} from 'node:crypto';
import {admin,body,db,fail,handler} from '../backend/lib/server.mjs';
import {tokenHash} from '../backend/lib/transfer.mjs';
import {catalogueVisible} from '../backend/lib/catalogue-quality.mjs';
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'});
export function validPickupDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value&&value>=today();}
export default handler(async(req,res)=>{
 if(req.method==='GET'){
  if(req.query?.admin==='1'){await admin(req);res.json(await db('pickup_reservations?select=order_id,reference,customer_name,pickup_date,status,staff_note,created_at,updated_at,orders(email,phone,total_kobo,payment_status,fulfillment_status,order_items(product_name,quantity,unit_price_kobo))&order=created_at.desc&limit=500'));return;}
  const match=/^Pickup ([a-f0-9]{64})$/.exec(req.headers.authorization||'');if(!match)fail(401,'Open your reservation in the browser where you requested it.');
  const rows=await db('pickup_reservations?token_hash=eq.'+tokenHash(match[1])+'&select=reference,customer_name,pickup_date,status,staff_note,orders(total_kobo,payment_status,fulfillment_status,order_items(product_name,quantity,unit_price_kobo))');if(!rows.length)fail(404,'Reservation not found.');res.json(rows[0]);return;
 }
 const b=body(req);
 if(req.method==='PATCH'){
  const actor=await admin(req);if(!/^[a-f0-9-]{36}$/.test(b.id||'')||!['confirmed','ready','collected','cancelled','reschedule'].includes(b.action))fail(400,'Invalid reservation action.');
  if(b.action==='collected'&&b.received!==true)fail(400,'Confirm payment was received and the device collected.');if(b.action==='reschedule'&&!validPickupDate(b.date))fail(400,'Choose a valid future pickup date.');
  res.json(await db('rpc/review_pickup_reservation',{method:'POST',body:JSON.stringify({p_actor:actor.id,p_order:b.id,p_action:b.action,p_note:String(b.note||'').slice(0,500),p_date:b.action==='reschedule'?b.date:null})}));return;
 }
 if(req.method!=='POST')fail(405,'Method not allowed.');
 if(typeof b.name!=='string'||b.name.trim().length<2||b.name.length>120||typeof b.email!=='string'||b.email.length>254||!/^\S+@\S+\.\S+$/.test(b.email)||typeof b.phone!=='string'||!/^\+?[0-9 ()-]{7,25}$/.test(b.phone)||!validPickupDate(b.date))fail(400,'Check your name, contact details and pickup date.');
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>20||b.items.some(i=>!i||!/^[a-f0-9-]{36}$/.test(i.id||'')||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>99))fail(400,'Check your selected products and quantities.');
 const products=await db('products?id=in.('+b.items.map(i=>i.id).join(',')+')&select=id,published,price_kobo,images,attributes');if(products.length!==b.items.length||products.some(p=>!p.published||!catalogueVisible(p)))fail(409,'One or more products are unavailable. Refresh your selection.');
 const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];if(!await db('rpc/allow_checkout',{method:'POST',body:JSON.stringify({p_key:tokenHash('pickup:'+ip+process.env.SUPABASE_SERVICE_ROLE_KEY)})}))fail(429,'Please wait before requesting another reservation.');
 const token=/^[a-f0-9]{64}$/.test(b.token||'')?b.token:randomBytes(32).toString('hex');const result=await db('rpc/reserve_store_pickup',{method:'POST',body:JSON.stringify({p_email:b.email.trim(),p_phone:b.phone,p_name:b.name.trim(),p_items:b.items,p_date:b.date,p_token_hash:tokenHash(token)})});res.json({reference:result.reference||result.paystack_reference,token});
});

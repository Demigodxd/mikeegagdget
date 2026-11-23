import {admin,body,db,fail,handler} from '../lib/server.mjs';
import {uuid} from '../lib/customer.mjs';
import {deliverNotifications} from '../lib/notifications.mjs';
export default handler(async(req,res)=>{
 const actor=await admin(req);
 if(req.method==='GET'){
  const pending=await db('notification_outbox?status=in.(pending,failed,sending)&select=id,event,status,attempts,last_error,created_at&order=created_at.desc&limit=100');
  res.json({paymentsConfigured:!!process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_'),paymentsEnabled:process.env.PAYMENTS_ENABLED==='true',emailConfigured:!!(process.env.RESEND_API_KEY&&process.env.ORDER_EMAIL_FROM),notifications:pending});return;
 }
 if(req.method==='POST'){res.json(await deliverNotifications());return;}
 if(req.method!=='PATCH')fail(405,'Method not allowed.');const b=body(req);
 if(!uuid(b.order_id)||typeof b.customer_note!=='string'||b.customer_note.length>1000||typeof b.carrier!=='string'||b.carrier.length>100||typeof b.tracking_number!=='string'||b.tracking_number.length>100||b.estimated_date&&(!/^\d{4}-\d{2}-\d{2}$/.test(b.estimated_date)||Number.isNaN(Date.parse(b.estimated_date))||new Date(b.estimated_date+'T12:00:00Z').toISOString().slice(0,10)!==b.estimated_date))fail(400,'Check the collection or delivery details.');
 const data={order_id:b.order_id,estimated_date:b.estimated_date||null,carrier:b.carrier,tracking_number:b.tracking_number,customer_note:b.customer_note,updated_at:new Date().toISOString()};
 await db('order_delivery_updates?on_conflict=order_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(data)});
 await db('order_audit',{method:'POST',body:JSON.stringify({order_id:b.order_id,actor_id:actor.id,action:'delivery_update',note:b.customer_note})});
 await db('notification_outbox',{method:'POST',body:JSON.stringify({order_id:b.order_id,event:'delivery_update',payload:{customer_note:b.customer_note}})});
 await deliverNotifications();res.json({saved:true});
});

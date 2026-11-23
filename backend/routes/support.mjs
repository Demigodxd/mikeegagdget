import {deliverNotifications} from '../lib/notifications.mjs';
import {randomBytes} from 'node:crypto';
import {admin,body,db,fail,handler} from '../lib/server.mjs';
import {tokenHash} from '../lib/transfer.mjs';
import {limited,matchingOrder,uuid} from '../lib/customer.mjs';
export default handler(async(req,res)=>{
 if(req.method==='GET'){
  if(req.query.admin==='1'){await admin(req);res.json(await db('support_tickets?select=id,reference,topic,details,status,updates,created_at,updated_at,orders(email,phone,paystack_reference)&order=updated_at.desc&limit=200'));return;}
  const token=/^Support ([a-f0-9]{64})$/.exec(req.headers.authorization||'')?.[1];if(!token)fail(401,'Open your private support link.');
  const rows=await db('support_tickets?token_hash=eq.'+tokenHash(token)+'&select=reference,topic,details,status,updates,created_at,updated_at');if(!rows.length)fail(404,'Support request not found.');res.json(rows[0]);return;
 }
 const b=body(req);
 if(req.method==='PATCH'){
  const actor=await admin(req);if(!uuid(b.id)||!['received','in_review','awaiting_customer','repairing','resolved'].includes(b.status)||typeof b.message!=='string'||b.message.trim().length<3||b.message.length>1500)fail(400,'Choose a status and add a customer update.');
  const current=(await db('support_tickets?id=eq.'+b.id+'&select=updates,updated_at,order_id'))[0];if(!current)fail(404,'Support request not found.');
  const result=await db('support_tickets?id=eq.'+b.id+'&updated_at=eq.'+encodeURIComponent(current.updated_at),{method:'PATCH',body:JSON.stringify({status:b.status,updated_at:new Date().toISOString(),updates:[...current.updates,{status:b.status,message:b.message.trim(),at:new Date().toISOString()}]})});if(!result.length)fail(409,'Another staff member updated this request. Reload it.');
  await db('order_audit',{method:'POST',body:JSON.stringify({order_id:current.order_id,actor_id:actor.id,action:'support_update',note:b.status})});res.json({saved:true});return;
 }
 if(req.method!=='POST')fail(405,'Method not allowed.');await limited(req,'support:');
 const order=await matchingOrder(b.reference,b.email);
 if(typeof b.topic!=='string'||b.topic.length<2||b.topic.length>100||typeof b.details!=='string'||b.details.trim().length<10||b.details.length>2000)fail(400,'Describe how we can help in at least 10 characters.');
 const token=randomBytes(32).toString('hex'),reference='LISA-CARE-'+randomBytes(6).toString('hex').toUpperCase();
 await db('support_tickets',{method:'POST',body:JSON.stringify({order_id:order.id,token_hash:tokenHash(token),reference,topic:b.topic,details:b.details.trim(),updates:[{status:'received',message:'Your request is with Lisa’s after-sales team.',at:new Date().toISOString()}]})});
 res.json({reference,token});
});

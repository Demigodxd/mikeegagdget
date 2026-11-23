import {deliverPurchaseAnalytics} from './shopping-analytics.mjs';
import {db} from './server.mjs';
const titles={order_placed:'Your Lisa order is received',payment_paid:'Your payment is confirmed',order_processing:'Lisa is preparing your order',order_shipped:'Your Lisa order is on its way',order_completed:'Thank you for shopping with Lisa',order_cancelled:'An update about your Lisa order',delivery_update:'Your collection or delivery update',support_update:'Lisa has an update on your support request'};
export function notificationMessage(event,order,payload={}){
 const title=titles[event]||'An update about your Lisa order';
 const money=new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN'}).format(order.total_kobo/100);
 const items=(order.order_items||[]).map(i=>i.product_name+' × '+i.quantity).join('\n');
 const note=String(payload.customer_note||'');
 return {subject:title,text:[title,'Order: '+order.paystack_reference,items,'Order total: '+money,note,'Track your order: https://www.lisaelectronics.com.ng/account/','Use your order reference and checkout email.','Need help? https://www.lisaelectronics.com.ng/service/','WhatsApp: +2347089254544','Lisa Electronics · 10 Pepple Street, Computer Village, Ikeja'].filter(Boolean).join('\n\n')};
}
async function processNotifications(){
 if(!process.env.RESEND_API_KEY||!process.env.ORDER_EMAIL_FROM)return {configured:false,sent:0,failed:0};
 const jobs=await db('rpc/claim_customer_notifications',{method:'POST',body:'{}'});let sent=0,failed=0;
 for(const job of jobs){try{
  const order=(await db('orders?id=eq.'+job.order_id+'&select=email,paystack_reference,total_kobo,order_items(product_name,quantity)'))[0];
  if(!order)throw Error('Order missing');
  const msg=notificationMessage(job.event,order,job.payload);
  const r=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(8000),headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'lisa-order-'+job.id},body:JSON.stringify({from:process.env.ORDER_EMAIL_FROM,to:[order.email],...msg})});
  if(!r.ok)throw Error('Email provider returned '+r.status);
  await db('notification_outbox?id=eq.'+job.id,{method:'PATCH',body:JSON.stringify({status:'sent',sent_at:new Date().toISOString(),last_error:null})});sent++;
 }catch(e){failed++;await db('notification_outbox?id=eq.'+job.id,{method:'PATCH',body:JSON.stringify({status:'failed',available_at:new Date(Date.now()+Math.min(86400000,60000*2**job.attempts)).toISOString(),last_error:String(e.message).slice(0,200)})});}}
 return {configured:true,sent,failed};
}

export async function deliverNotifications(){await deliverPurchaseAnalytics();try{return await processNotifications();}catch{console.error('Order notification processing will retry.');return {configured:!!(process.env.RESEND_API_KEY&&process.env.ORDER_EMAIL_FROM),sent:0,failed:1};}}

import {createHash} from 'node:crypto';
import {db} from './server.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function cleanAttribution(value){
 if(value?.consent!==true||!/^\d{1,20}\.\d{1,20}$/.test(value.client_id||'')||!/^[a-f0-9]{64}$/.test(value.consent_token||''))return null;
 return {client_id:value.client_id,session_id:/^\d{1,20}$/.test(value.session_id||'')?value.session_id:null,consent_token_hash:hash(value.consent_token)};
}
export async function recordAttribution(reference,value){
 const attribution=cleanAttribution(value);if(!attribution||!/^G-[A-Z0-9]+$/.test(process.env.GA4_MEASUREMENT_ID||''))return;
 try{const rows=await db('orders?paystack_reference=eq.'+encodeURIComponent(reference)+'&select=id');if(!rows[0])return;await db('analytics_attributions?on_conflict=order_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({order_id:rows[0].id,...attribution})});}catch{console.error('Optional order analytics could not be attached.');}
}
export function purchasePayload(order,attribution){
 if(order?.payment_status!=='paid'||order.currency!=='NGN'||!order.order_items?.length)return null;
 const items=order.order_items.map(i=>({item_id:i.sku,item_name:String(i.product_name||i.sku).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g,'[redacted]').slice(0,100),quantity:i.quantity,price:i.unit_price_kobo/100}));
 if(items.some(i=>!i.item_id||!Number.isInteger(i.quantity)||i.quantity<1||!Number.isFinite(i.price)||i.price<=0))return null;
 return {client_id:attribution.client_id,consent:{ad_user_data:'DENIED',ad_personalization:'DENIED'},events:[{name:'purchase',params:{transaction_id:'lisa_'+hash(order.id).slice(0,32),currency:'NGN',value:order.subtotal_kobo/100,shipping:order.delivery_kobo/100,items,engagement_time_msec:1,...(attribution.session_id?{session_id:Number(attribution.session_id)}:{})}}]};
}
export async function deliverPurchaseAnalytics(){
 const id=process.env.GA4_MEASUREMENT_ID,secret=process.env.GA4_API_SECRET;if(!/^G-[A-Z0-9]+$/.test(id||'')||!secret)return {configured:false,sent:0,failed:0};let sent=0,failed=0;
 try{const jobs=await db('rpc/claim_analytics_purchases',{method:'POST',body:'{}'});
 for(const job of jobs){try{const current=await db('analytics_attributions?order_id=eq.'+job.order_id+'&select=order_id');if(!current.length)continue;
 const order=(await db('orders?id=eq.'+job.order_id+'&select=id,payment_status,currency,subtotal_kobo,delivery_kobo,order_items(sku,product_name,quantity,unit_price_kobo)'))[0];
 const payload=purchasePayload(order,job);if(!payload)throw Error('Paid order data unavailable');
 const response=await fetch('https://www.google-analytics.com/mp/collect?measurement_id='+encodeURIComponent(id)+'&api_secret='+encodeURIComponent(secret),{method:'POST',signal:AbortSignal.timeout(6000),headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!response.ok)throw Error('Analytics provider returned '+response.status);
 await db('analytics_attributions?order_id=eq.'+job.order_id,{method:'PATCH',body:JSON.stringify({status:'sent',sent_at:new Date().toISOString(),last_error:null})});sent++;
 }catch(e){failed++;await db('analytics_attributions?order_id=eq.'+job.order_id,{method:'PATCH',body:JSON.stringify({status:'failed',available_at:new Date(Date.now()+Math.min(86400000,60000*2**job.attempts)).toISOString(),last_error:e.message.slice(0,120)})});}}
 }catch{failed++;console.error('Optional purchase analytics will retry.');}
 return {configured:true,sent,failed};
}
export async function revokeAttribution(token){if(!/^[a-f0-9]{64}$/.test(token||''))return;await db('analytics_attributions?consent_token_hash=eq.'+hash(token),{method:'DELETE'});}

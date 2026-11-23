import {config,db,fail} from './server.mjs';
import {tokenHash} from './transfer.mjs';
export const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export async function customer(req){
 const authorization=req.headers.authorization||'';
 if(!/^Bearer [^\s]+$/.test(authorization))fail(401,'Sign in to your Lisa account.');
 const {url,key}=config();const r=await fetch(url+'/auth/v1/user',{headers:{apikey:key,Authorization:authorization}});
 if(!r.ok)fail(401,'Please sign in again.');const u=await r.json();
 if(!uuid(u.id)||!u.email||!u.email_confirmed_at)fail(403,'Verify your email to continue.');return u;
}
export async function limited(req,scope){const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];if(!await db('rpc/allow_checkout',{method:'POST',body:JSON.stringify({p_key:tokenHash(scope+ip+process.env.SUPABASE_SERVICE_ROLE_KEY)})}))fail(429,'Please wait a moment before trying again.');}
export function cleanState(s){
 if(!s||typeof s!=='object'||Array.isArray(s))fail(400,'Invalid saved account data.');
 const saved=Array.isArray(s.saved)?[...new Set(s.saved.filter(uuid))].slice(0,100):[];
 const cart=Array.isArray(s.cart)?s.cart.slice(0,20).map(l=>({id:l?.id,quantity:l?.quantity})):[];
 if(cart.some(l=>!uuid(l.id)||!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>99)||new Set(cart.map(l=>l.id)).size!==cart.length)fail(400,'Check your cart quantities.');
 const addresses=Array.isArray(s.addresses)?s.addresses.slice(0,5).map(a=>Object.fromEntries(['recipient','street','city','state','phone'].map(k=>[k,String(a?.[k]||'').trim().slice(0,k==='street'?300:120)]))):[];
 return {saved,cart,addresses};
}
export async function matchingOrder(reference,email){
 if(!/^lisa_[a-f0-9-]{36}$/.test(reference||'')||typeof email!=='string'||email.length>254)fail(400,'Enter your order reference and checkout email.');
 const rows=await db('orders?paystack_reference=eq.'+encodeURIComponent(reference)+'&email=ilike.'+encodeURIComponent(email.trim().replace(/\\/g,'\\\\').replace(/[%_]/g,v=>'\\'+v).replaceAll('*','\\%'))+'&select=id,paystack_reference,email,payment_status,fulfillment_status,total_kobo,order_items(product_id,product_name,quantity)');
 if(!rows.length)fail(404,'Check your order reference and email.');return rows[0];
}

import {fail,handler,paystack} from '../lib/server.mjs';
let cached,expires=0,pending;
export default handler(async(req,res)=>{
 if(req.method!=='GET')fail(405,'Method not allowed.');
 const liveKeyConfigured=process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_')===true;
 if(!liveKeyConfigured)return res.json({liveKeyConfigured:false,providerConnected:false,paymentsEnabled:false});
 // A read-only bank-list request verifies authentication without a customer or transaction.
 // Coalesce and cache checks so this public status route cannot amplify provider requests.
 if(Date.now()>=expires){pending||=(async()=>{let providerConnected=false;try{const banks=await paystack('bank?country=nigeria&perPage=1');providerConnected=Array.isArray(banks)&&banks.length>0;}catch{}cached={liveKeyConfigured:true,providerConnected};expires=Date.now()+60000;})().finally(()=>pending=null);await pending;}
 res.json({...cached,paymentsEnabled:process.env.PAYMENTS_ENABLED==='true'});
});

import {admin,body,db,fail,handler} from '../backend/lib/server.mjs';
export default handler(async(req,res)=>{
 const actor=await admin(req);
 if(req.method==='GET'){res.json(await db('orders?select=*,order_items(product_name,sku,quantity,unit_price_kobo),bank_transfers(reference,sender_name,transfer_reference,claim_status,reported_at,reviewed_at)&order=created_at.desc&limit=500'));return;}
 if(req.method!=='PATCH')fail(405,'Method not allowed.');
 const b=body(req);if(!/^[0-9a-f-]{36}$/.test(b.id||''))fail(400,'Invalid order.');
 if(!['confirm_transfer','reject_transfer','fulfillment'].includes(b.action))fail(400,'Invalid action.');
 if(b.action==='confirm_transfer'&&b.received!==true)fail(400,'Confirm that the money has reached Lisa’s account.');
 res.json(await db('rpc/review_store_order',{method:'POST',body:JSON.stringify({p_actor:actor.id,p_order:b.id,p_action:b.action,p_note:String(b.note||'').slice(0,500),p_fulfillment:b.fulfillment||null})}));
});

import {body,db,fail,handler} from '../backend/lib/server.mjs';
import {transferToken,cleanClaim} from '../backend/lib/transfer.mjs';
export default handler(async(req,res)=>{
 const hash=transferToken(req);
 if(req.method==='GET'){
  const rows=await db(`bank_transfers?token_hash=eq.${hash}&select=reference,bank_snapshot,claim_status,sender_name,reported_at,orders(total_kobo,payment_status,fulfillment_status)`);
  if(!rows.length)fail(404,'Transfer order not found.');
  res.json(rows[0]);return;
 }
 if(req.method!=='POST')fail(405,'Method not allowed.');
 const claim=cleanClaim(body(req));
 res.json(await db('rpc/report_bank_transfer',{method:'POST',body:JSON.stringify({p_token_hash:hash,p_sender:claim.sender,p_transfer_reference:claim.reference})}));
});

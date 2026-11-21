import {db,handler} from '../backend/lib/server.mjs';
import {bankDetails} from '../backend/lib/transfer.mjs';
export default handler(async(req,res)=>{let bankTransferEnabled=false;try{const rows=await db('store_settings?key=eq.bank_transfer&select=value');bankTransferEnabled=!!bankDetails(rows[0]?.value);}catch{}res.json({url:process.env.SUPABASE_URL||'',key:process.env.SUPABASE_PUBLISHABLE_KEY||'',paymentsEnabled:process.env.PAYMENTS_ENABLED==='true',bankTransferEnabled});});

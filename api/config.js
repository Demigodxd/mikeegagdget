import {handler} from '../backend/lib/server.mjs';
export default handler(async(req,res)=>{res.json({url:process.env.SUPABASE_URL||'',key:process.env.SUPABASE_PUBLISHABLE_KEY||'',paymentsEnabled:process.env.PAYMENTS_ENABLED==='true'});});

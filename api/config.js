import customer from '../backend/routes/customer.mjs';
import reviews from '../backend/routes/reviews.mjs';
import support from '../backend/routes/support.mjs';
import care from '../backend/routes/customer-care.mjs';
import notifications from '../backend/routes/notification-worker.mjs';
import {db,handler} from '../backend/lib/server.mjs';
import {bankDetails} from '../backend/lib/transfer.mjs';
export default handler(async(req,res)=>{if(req.query?.feature){const routes={customer,reviews,support,care,notifications};const route=Object.hasOwn(routes,req.query.feature)?routes[req.query.feature]:null;if(!route)return res.status(404).json({error:'Unknown feature.'});return route(req,res);}let bankTransferEnabled=false;try{const rows=await db('store_settings?key=eq.bank_transfer&select=value');bankTransferEnabled=!!bankDetails(rows[0]?.value);}catch{}res.json({url:process.env.SUPABASE_URL||'',key:process.env.SUPABASE_PUBLISHABLE_KEY||'',paymentsEnabled:process.env.PAYMENTS_ENABLED==='true',bankTransferEnabled});});

import {body,handler,fail} from '../lib/server.mjs';
import {revokeAttribution} from '../lib/shopping-analytics.mjs';
export default handler(async(req,res)=>{
 if(req.method!=='POST')fail(405,'Method not allowed.');
 const origin=req.headers.origin;if(origin&&!['https://www.lisaelectronics.com.ng','https://lisaelectronics.com.ng'].includes(origin))fail(403,'Open Lisa’s website to change your preferences.');
 const token=body(req).consent_token;if(!/^[a-f0-9]{64}$/.test(token||''))fail(400,'Invalid privacy request.');
 await revokeAttribution(token);res.json({revoked:true});
});

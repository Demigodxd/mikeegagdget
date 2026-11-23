import {timingSafeEqual} from 'node:crypto';
import {handler,fail} from '../lib/server.mjs';
import {deliverNotifications} from '../lib/notifications.mjs';
export default handler(async(req,res)=>{
 if(req.method!=='GET')fail(405,'Method not allowed.');
 const expected=process.env.CRON_SECRET?'Bearer '+process.env.CRON_SECRET:'',received=req.headers.authorization||'';
 if(!expected||received.length!==expected.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(received)))fail(401,'Unauthorised.');
 res.json(await deliverNotifications());
});

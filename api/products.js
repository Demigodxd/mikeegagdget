import {db,handler} from '../backend/lib/server.mjs';
export default handler(async(req,res)=>{if(req.method!=='GET')return res.status(405).end();res.json(await db('products?published=eq.true&select=id,sku,slug,name,description,price_kobo,stock_quantity,track_stock,allow_backorder,images,attributes&order=name&limit=1000'));});

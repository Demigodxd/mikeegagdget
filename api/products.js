import {db,handler} from '../backend/lib/server.mjs';
import {catalogueVisible} from '../backend/lib/catalogue-quality.mjs';
export default handler(async(req,res)=>{if(req.method!=='GET')return res.status(405).end();const products=await db('products?published=eq.true&price_kobo=gt.0&select=id,sku,slug,name,description,price_kobo,stock_quantity,track_stock,allow_backorder,images,attributes,category_id,categories(slug,name)&order=name&limit=1000');res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=60');res.json(products.filter(catalogueVisible));});

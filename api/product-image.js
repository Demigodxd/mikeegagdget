import {productGalleries} from '../assets/product-galleries.mjs';
import {handler,fail} from '../backend/lib/server.mjs';

// Only catalogue-owned URLs can be fetched; this is not an arbitrary URL proxy.
export default handler(async(req,res)=>{
 if(req.method!=='GET')fail(405,'Method not allowed.');
 const {model,index}=req.query||{};
 if(typeof model!=='string'||!/^\d{1,2}$/.test(String(index)))fail(400,'Invalid product image.');
 const photos=Object.hasOwn(productGalleries,model)?productGalleries[model]:null;
 const src=photos?.[Number(index)];
 if(!src?.startsWith('https://'))fail(404,'Product image unavailable.');
 const image=await fetch(src,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'Mozilla/5.0'}});
 const type=image.headers.get('content-type')?.split(';')[0];
 if(!image.ok||!/^image\/(jpeg|png|webp|avif|gif)$/.test(type||''))fail(502,'Product image temporarily unavailable.');
 const limit=4*1024*1024;
 if(Number(image.headers.get('content-length'))>limit)fail(502,'Product image too large.');
 const chunks=[];let size=0;
 for await(const chunk of image.body){size+=chunk.length;if(size>limit)fail(502,'Product image too large.');chunks.push(Buffer.from(chunk));}
 res.setHeader('Content-Type',type);res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
 res.end(Buffer.concat(chunks));
});

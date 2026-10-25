import {storeItems,categories} from '../commerce/storefront-data.mjs';
import {writeFileSync} from 'node:fs';
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
let sql='';
for(const c of categories)sql+=`insert into public.categories(slug,name) values(${q(c.id)},${q(c.name)}) on conflict(slug) do nothing;\n`;
let count=0;
for(const p of storeItems)for(const [i,v] of p.variants.entries()){
 const sku=`${p.slug}-${i+1}`;
 const price=Number.isFinite(v.price)?Math.round(v.price*100):0;
 const attributes={...v,source_slug:p.slug,brand:p.brand,conditions:p.conditions,price_needs_review:true};
 sql+=`insert into public.products(sku,slug,name,category_id,price_kobo,images,attributes,published,stock_quantity) values(${q(sku)},${q(sku)},${q(p.model+' — '+v.storage)},(select id from public.categories where slug=${q(p.category)}),${price},${q(JSON.stringify(p.image?[new URL(p.image,'https://lisaelectronics.vercel.app').href]:[]))}::jsonb,${q(JSON.stringify(attributes))}::jsonb,false,0) on conflict(sku) do nothing;\n`;count++;
}
writeFileSync('/tmp/lisa-catalog.sql',sql);console.log(JSON.stringify({products:storeItems.length,variants:count,categories:categories.length}));

import {modelSpecifications} from './model-specifications.mjs';
const text=v=>typeof v==='string'||typeof v==='number'?String(v).trim():'';
export function productFacts(p){
 const a=p.attributes||{},name=p.name||'',rows=new Map();const add=(k,v)=>{if(text(v))rows.set(k,text(v));};
 add('Brand',a.brand);add('Model',a.model&&a.model.length<90?a.model:null);add('Condition',a.condition);
 if(text(a.storage).length<60)add('Storage / option',a.storage);add('RAM',a.ram);add('Colour',a.color);
 const specs={...(modelSpecifications[a.source_slug]||{}),...(a.specifications&&typeof a.specifications==='object'&&!Array.isArray(a.specifications)?a.specifications:{})};
 for(const [k,v] of Object.entries(specs).slice(0,30)){if(k.length<70&&text(v).length<500)add(({display:'Display',camera:'Camera',processor:'Processor',battery:'Battery',network:'Network',security:'Security',sim:'SIM',charging:'Charging',ram:'RAM',storage:'Storage'})[k]||k,v);}
 // Only extract details explicitly supplied in the product name. Never infer a model's specifications.
 const captures=[['Processor',/\b((?:Intel\s+)?Core\s+(?:i[3579]|Ultra\s+[579])(?:[ -][A-Za-z0-9]+)?|(?:AMD\s+)?Ryzen\s+[3579](?:\s+Pro)?(?:\s+\d{4}[A-Z]*)?)/i],['RAM',/\b(\d+\s*GB)\s*RAM\b/i],['SSD',/\b(\d+\s*(?:GB|TB))\s*SSD\b/i],['Operating system',/\b(Windows\s+\d+(?:\s+Pro)?|Win\s?11\s?Pro)\b/i]];
 for(const [k,re]of captures){const m=name.match(re);if(m&&!rows.has(k))add(k,m[1]);}if(/touchscreen/i.test(name)&&!rows.has('Touchscreen'))add('Touchscreen','Yes');
 add('Included in the box',a.box_contents);add('Warranty',a.warranty);add('Battery health',a.battery_health);add('Inspection / condition notes',a.inspection_notes);
 return [...rows];
}
export function stockLabel(p){return p.track_stock&&p.stock_quantity>0?'In stock · '+p.stock_quantity+' available':p.track_stock&&!p.allow_backorder?'Currently unavailable':'Available to order';}
export function fulfilmentInfo(p){const a=p.attributes||{};return a.fulfilment_note||'Free pickup in Ikeja · Delivery ₦7,000 per order. Lisa will share your collection or delivery schedule with your order.';}
export function relatedProducts(p,all){return all.filter(x=>x.id!==p.id&&x.attributes?.source_slug!==p.attributes?.source_slug).map(x=>({x,score:(x.categories?.slug===p.categories?.slug?8:0)+(x.attributes?.brand===p.attributes?.brand?4:0)-Math.abs(x.price_kobo-p.price_kobo)/Math.max(p.price_kobo,1)})).sort((a,b)=>b.score-a.score).slice(0,4).map(v=>v.x);}

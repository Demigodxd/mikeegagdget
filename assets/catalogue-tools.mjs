export const normalise=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function filterProducts(products,{q='',category='',brand='',condition='',min='',max='',stock=false}={}){
 const query=normalise(q),low=min===''?0:Number(min)*100,high=max===''?Infinity:Number(max)*100;
 const inCategory=p=>!category||(category==='android'?['android','samsung','pixel','tecno'].includes(p.categories?.slug):p.categories?.slug===category);
 return products.filter(p=>p.price_kobo>0&&inCategory(p)&&(!brand||p.attributes?.brand===brand)&&(!condition||p.attributes?.condition===condition)&&(!stock||p.track_stock&&p.stock_quantity>0)&&p.price_kobo>=low&&p.price_kobo<=high&&normalise([p.name,p.sku,p.attributes?.brand,p.attributes?.storage].join(' ')).includes(query));
}
export function modelGroups(products,sort='name'){
 const groups=new Map();for(const p of products){const key=p.attributes?.source_slug||p.id;const prior=groups.get(key);if(!prior||p.price_kobo<prior.price_kobo)groups.set(key,p);}
 return [...groups.values()].sort((a,b)=>sort==='low'?a.price_kobo-b.price_kobo:sort==='high'?b.price_kobo-a.price_kobo:sort==='stock'?Number(!!b.stock_quantity)-Number(!!a.stock_quantity):a.name.localeCompare(b.name,undefined,{numeric:true}));
}
export function readIds(storage,key,max=100){try{const ids=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(ids)?[...new Set(ids.filter(v=>typeof v==='string'))].slice(0,max):[];}catch{return [];}}
export function csvText(rows){return '\ufeff'+rows.map(row=>row.map(value=>{let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}

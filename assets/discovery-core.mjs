const normalize=value=>String(value??'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function matchesDevice(item,query){
 const haystack=normalize([item.model,item.brand,item.category,...item.variants.map(v=>v.storage)].join(' '));
 return String(query).trim().split(/\s+/).filter(Boolean).every(token=>haystack.includes(normalize(token)));
}
export function sortDevices(items,sort='featured'){
 const price=item=>{const values=item.variants.map(v=>v.price).filter(v=>Number.isFinite(v)&&v>0);return values.length?Math.min(...values):null;};
 return [...items].sort((a,b)=>{if(sort==='name')return a.model.localeCompare(b.model);if(!['price-asc','price-desc'].includes(sort))return 0;const x=price(a),y=price(b);if(x===null)return y===null?0:1;if(y===null)return -1;return sort==='price-asc'?x-y:y-x;});
}

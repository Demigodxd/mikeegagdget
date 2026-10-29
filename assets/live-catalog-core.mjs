export const money=k=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN'}).format(k/100);
export const available=p=>p.price_kobo>0&&(!p.track_stock||p.allow_backorder||p.stock_quantity>0);
export function reconcileCart(saved,products){return saved.map(line=>{const product=products.find(p=>p.id===line.id);const quantity=Math.min(99,Math.max(1,Math.floor(Number(line.quantity)||1)));return product?{product,quantity,unavailable:!available(product)}:{product:null,id:line.id,quantity,unavailable:true};});}
export const subtotal=lines=>lines.reduce((sum,l)=>sum+(l.product?.price_kobo||0)*l.quantity,0);
export function readCart(storage){try{const v=JSON.parse(storage.getItem('lisa-cart')||'[]');return Array.isArray(v)?v.filter(l=>typeof l.id==='string').slice(0,20):[];}catch{return [];}}
export function saveCart(storage,lines){storage.setItem('lisa-cart',JSON.stringify(lines.map(l=>({id:l.id,quantity:l.quantity}))));}

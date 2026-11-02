import {mkdir,writeFile} from 'node:fs/promises';
import {productGalleries as original} from '../assets/product-galleries.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function wrap(s,limit=29){const lines=[];let line='';for(const word of String(s).split(/\s+/)){if(line&&(line+' '+word).length>limit){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;}
const text=(lines,x,y,size=18,fill='#696a73',weight=400)=>lines.map((line,i)=>`<text x="${x}" y="${y+i*(size*1.4)}" fill="${fill}" font-size="${size}" font-weight="${weight}">${esc(line)}</text>`).join('');
function card(product,type){
 const model=product.model,unknown=['sony-headphone','apple-pencil-2nd-gen-type-c','samsung-galaxy-watch-7-fe'].includes(product.slug);
 const options=[...new Set(product.variants.map(v=>v.storage).filter(v=>v&&!/^standard|options confirmed/i.test(v)))].join(' · ');
 const heading=type===1?(unknown?'MODEL CONFIRMATION':'PRODUCT INFORMATION'):type===2?'PICKUP & DELIVERY':'BEFORE YOU ORDER';
 const rows=type===1?(unknown?['Exact model to be confirmed with Lisa.','Ask for current photos and specifications.','This listing is an enquiry.']:[product.brand+' · '+model,options?'Listed options: '+options:'Exact configuration confirmed with Lisa.','Confirm colour, condition and availability.']):type===2?['Free pickup at our Ikeja store.','10 Pepple Street, Computer Village.','Delivery in Nigeria: ₦7,000 per order.']:['Confirm the exact model and condition.','Ask about included accessories and warranty.','Lisa confirms availability before payment.'];
 const title=wrap(model,27),body=rows.flatMap(row=>[...wrap(row,50),'']).slice(0,9);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" role="img" aria-labelledby="title desc"><title id="title">${esc(model+' — '+heading.toLowerCase())}</title><desc id="desc">Labelled information card. ${esc(rows.join(' '))}</desc><rect width="720" height="720" rx="26" fill="#f6f6f8"/><rect x="28" y="28" width="664" height="664" rx="20" fill="white" stroke="#e5e5ea"/><g font-family="Arial, sans-serif"><rect x="60" y="62" width="47" height="47" rx="12" fill="#b60018"/><text x="83.5" y="94" text-anchor="middle" font-size="25" font-weight="700" fill="white">L</text><text x="122" y="83" fill="#202127" font-size="16" font-weight="700" letter-spacing="2">LISA ELECTRONICS</text><text x="122" y="105" fill="#696a73" font-size="12">Good tech. Great possibilities.</text><text x="60" y="157" fill="#b60018" font-size="12" font-weight="700" letter-spacing="1.5">${esc(heading)}</text>${text(title,60,207,31,'#202127',700)}<path d="M60 365H660" stroke="#e5e5ea"/>${text(body,60,405,17)}<rect x="60" y="634" width="600" height="1" fill="#e5e5ea"/><text x="60" y="665" font-size="12" fill="#696a73">Information card · product photographs appear separately</text></g></svg>`;
}
await mkdir('images/product-details',{recursive:true});
const galleries={},coverage=[];
for(const product of storeItems){const photos=(original[product.slug]||[]).filter(u=>!u.startsWith('/images/product-details/'));galleries[product.slug]=[...new Set(photos)];const needed=Math.max(0,3-galleries[product.slug].length),count=Math.max(1,needed);for(let i=1;i<=count;i++){const path=`images/product-details/${product.slug}-${i}-v2.svg`;await writeFile(path,card(product,i));galleries[product.slug].push('/'+path);}coverage.push({model:product.model,slug:product.slug,photos:photos.length,informationCards:count,cardsNeededToReachThree:needed,galleryImages:galleries[product.slug].length});}
await writeFile('assets/product-galleries.mjs','// Model photos plus clearly labelled product information cards.\nexport const productGalleries = '+JSON.stringify(galleries,null,2)+';\n');
await writeFile('docs/gallery-coverage.json',JSON.stringify(coverage,null,2));
console.log(`Prepared ${coverage.length} complete galleries; ${coverage.filter(p=>p.cardsNeededToReachThree).length} use labelled cards to reach three images.`);

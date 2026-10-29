import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {categories,shopCategories,storeItems} from '../commerce/storefront-data.mjs';
import {card,media,escape,priceText} from '../assets/storefront-ui.mjs';
import {commerceSite as site} from '../commerce/catalog.mjs';
import {featuredDeals} from '../commerce/offers.mjs';
let html=await readFile('templates/home.html.template','utf8');
html=html.replace('{{COLOUR_OPTIONS}}',[...new Set(storeItems.flatMap(item=>item.variants.flatMap(v=>v.color?.split('/').map(c=>c.trim())||[])))].sort().map(c=>`<option>${escape(c)}</option>`).join(''));
const trust=html.match(/<div class="trust-loop">([\s\S]*?)<\/div>/)?.[1]||'';
html=html.replace('{{TRUST_DUPLICATE}}','<div class="trust-loop" aria-hidden="true">'+trust+'</div>');
const categoryHtml=categories.map(c=>`<a class="category-tile" href="${c.route}" data-category="${c.id}">${media(c.image,c.name)}<strong>${c.name}</strong><span aria-hidden="true">Shop ↗</span></a>`).join('');
html=html.replace('{{SERIES_OPTIONS}}',[...new Set(storeItems.map(p=>p.series).filter(Boolean))].map(series=>`<option value="${series}">iPhone ${series}</option>`).join('')).replace('{{CATEGORIES}}',categoryHtml).replace('{{CATEGORY_OPTIONS}}',categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')).replace('{{PRODUCTS}}',storeItems.filter(p=>p.variants.some(v=>v.price>0)).slice(0,8).map(item=>card(item,true)).join('')).replace('{{HOT_DEALS}}',featuredDeals(storeItems).map(card).join('')||'<p class="empty-deals">Current catalogue prices are shown above. Contact Lisa Electronics to ask about current offers.</p>');
const shelf = id=>storeItems.filter(p=>p.category===id && p.image);
for (const [key,id] of [['SPEAKERS','speakers'],['EARBUDS','earbuds'],['ACCESSORIES','accessories']]) html=html.replace('{{'+key+'}}',shelf(id).slice(0,5).map(p=>card(p)).join(''));
for (const [key,id] of [['SPEAKER_ART','speakers'],['BUDS_ART','earbuds'],['POWER_ART','power-banks']]) {const p=shelf(id)[0];html=html.replace('{{'+key+'}}',p?media(p.image,p.model):'');}
html=html.replace('{{BRAND_OPTIONS}}',[...new Set(storeItems.map(p=>p.brand))].sort().map(b=>`<option>${escape(b)}</option>`).join(''));
await writeFile('index.html',html);
await writeFile('assets/store-catalog.json',JSON.stringify(storeItems));
// Dedicated enquiry pages keep category browsing on the site until customers are ready.
for(const c of shopCategories){
 const title=`${c.name} in Ikeja | Lisa Electronics`;
 const description=`Shop ${c.name} at Lisa Electronics in Computer Village, Ikeja. Find a device for work, play and everyday use. Store pickup or delivery across Nigeria.`;
 const url=`${site.baseUrl}${c.route}`;
 const contact=`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(`Hello Lisa Electronics, I’m interested in ${c.name}. Please send the available models, condition, prices and payment options.`)}`;
 const listings=storeItems.filter(item=>item.category===c.id);
 const listingSection=listings.length?`<section class="store-section category-products"><div class="store-heading"><div><p class="eyebrow">CURRENT CATALOGUE</p><h2>Explore ${escape(c.name)}</h2></div><p>Confirm the exact unit, price and availability before payment.</p></div><div class="product-grid">${listings.map(card).join('')}</div></section>`:`<section class="store-section category-products"><div class="store-heading"><div><p class="eyebrow">ASK LISA</p><h2>Check current ${escape(c.name)} options</h2></div><p>Message the store for current models, prices and availability.</p></div></section>`;
 const ogImage=c.image||'/images/store/mikee-shop-1280.webp';
 const page=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="store-section category-detail"><a class="text-link" href="/?category=${c.id}#products">← Back to devices</a><div class="category-detail-grid">${media(c.image,c.name,true)}<div><p class="eyebrow">LISA ELECTRONICS</p><h1>${escape(c.name)}</h1><p>Find your next upgrade. Shop in Computer Village or order for delivery.</p><a class="btn btn-primary" href="${contact}">See options on WhatsApp ↗</a><dl><div><dt>Price &amp; stock</dt><dd>Models and prices vary. Check availability before payment.</dd></div><div><dt>Collection</dt><dd>Pickup in Ikeja or delivery across Nigeria</dd></div><div><dt>Payment</dt><dd>Pay outright. EasyBuy is subject to device eligibility and approval.</dd></div></dl><a class="call-link" href="tel:${site.telephoneHref}">Call ${site.telephoneDisplay}</a></div></div>${listingSection}</main>`).replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`)
 .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(description)}">`)
 .replace(/<meta name="keywords"[^>]*>\s*/, '')
 .replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escape(title)}">`)
 .replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${escape(description)}">`)
 .replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${escape(url)}">`)
 .replace(/<meta property="og:image"[^>]*>/,`<meta property="og:image" content="${escape(site.baseUrl+ogImage)}">`)
 .replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${escape(url)}" />`)
 .replace('data-landing-page="/" data-page-type="home"',`data-landing-page="${c.route}" data-page-type="category"`).replace(/href="#(products|categories|visit)"/g,'href="/#$1"');
 await mkdir(`shop/${c.id}`,{recursive:true});await writeFile(`shop/${c.id}/index.html`,page);
}
console.log(`Generated storefront, compact catalogue and ${shopCategories.length} gadget category pages.`);

for(const item of storeItems.filter(p=>p.enquiryUrl)){
 const main=`<main id="main" class="store-section"><p class="breadcrumbs"><a href="/">Home</a> / <a href="${categories.find(c=>c.id===item.category)?.route||'/#products'}">${escape(categories.find(c=>c.id===item.category)?.name||'Accessories')}</a></p><section class="accessory-layout"><div class="accessory-photo">${media(item.image,item.model,true)}</div><div class="accessory-copy"><p class="eyebrow">${escape(item.brand)} · LISA ELECTRONICS</p><h1>${escape(item.model)}</h1><p class="store-price">${priceText(item)}</p><p>${escape(item.conditions.join(' / '))}</p><p>Confirm the exact model, colour, warranty, current price and availability with Lisa before payment.</p><a class="btn btn-primary" href="${escape(item.enquiryUrl)}">Ask about this product on WhatsApp ↗</a><p><a href="tel:${site.telephoneHref}">Call ${site.telephoneDisplay}</a></p><p>Collect at No. 10 Pepple Street, Computer Village, Ikeja, or ask about delivery.</p><a href="https://share.google/F3PBLPkRmLXqiUX0U">Get directions to Lisa →</a></div></section><section class="related-products"><h2>More to explore</h2><div class="product-grid">${storeItems.filter(p=>p.category===item.category&&p.slug!==item.slug).slice(0,4).map(p=>card(p)).join('')}</div></section></main>`;
 const page=html.replace(/<main id="main">[\s\S]*?<\/main>/,main).replace(/<title>.*?<\/title>/,`<title>${escape(item.model)} | Lisa Electronics</title>`).replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${site.baseUrl}${item.route}">`).replace(/href="#(products|categories|visit)"/g,'href="/#$1"');
 await mkdir(`product/${item.slug}`,{recursive:true});await writeFile(`product/${item.slug}/index.html`,page);
}

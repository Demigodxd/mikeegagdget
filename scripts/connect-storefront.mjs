import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {storeItems,categories,shopCategories} from '../commerce/storefront-data.mjs';
if(process.env.VERCEL_ENV==='preview'||process.env.BACKEND_STOREFRONT==='true'){
 const shell=await readFile('index.html','utf8');
 const panel='<section id="liveStore" class="store-section"><p id="liveMessage" role="status">Loading current products…</p><div id="liveContent"></div></section>';
 const pages=new Map([['index.html',{mode:'home'}]]);
 for(const c of [...categories,...shopCategories]){const route=c.route?.replace(/^\//,'').replace(/\/$/,'');if(route)pages.set(route+'/index.html',{mode:'category',category:c.id});}
 for(const p of storeItems){const route=p.route?.replace(/^\//,'').replace(/\/$/,'');if(route)pages.set(route+'/index.html',{mode:'product',source:p.slug});}
 pages.set('catalogue/index.html',{mode:'product'});pages.set('cart/index.html',{mode:'cart'});
 for(const [path,data] of pages){let source;try{source=await readFile(path,'utf8');}catch{source=shell;}const dom=new JSDOM(source),d=dom.window.document;
 d.querySelectorAll('script').forEach(s=>{if(!s.src.includes('tiktok-pixel'))s.remove();});
 d.querySelectorAll('script[type="application/ld+json"]').forEach(s=>s.remove());
 if(data.mode==='home'){d.querySelectorAll('.product-grid').forEach(el=>el.replaceChildren());const old=d.querySelector('#products');if(old)old.outerHTML=panel;else d.querySelector('main').insertAdjacentHTML('beforeend',panel);d.querySelectorAll('.collection-section,.hot-deals').forEach(el=>el.remove());}else d.querySelector('main').innerHTML=panel;
 d.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');if(href==='#products')a.setAttribute('href','#liveStore');else if(href==='/#products')a.setAttribute('href','/#liveStore');});
 d.body.dataset.liveMode=data.mode;if(data.category)d.body.dataset.liveCategory=data.category;if(data.source)d.body.dataset.liveSource=data.source;
 const css=d.createElement('link');css.rel='stylesheet';css.href='/assets/live-store.css';d.head.append(css);
 const script=d.createElement('script');script.type='module';script.src='/assets/live-store.js';d.body.append(script);
 const cart=d.createElement('a');cart.href='/cart/';cart.textContent='Cart';cart.className='live-cart-link';d.querySelector('header')?.append(cart);
 await mkdir(path.slice(0,path.lastIndexOf('/'))||'.',{recursive:true});await writeFile(path,dom.serialize());
 }
 console.log('Connected preview home, categories, product pages and cart to live catalogue');
}

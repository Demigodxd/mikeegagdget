import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';import {JSDOM} from 'jsdom';import {storeItems} from '../commerce/storefront-data.mjs';import {productGalleries} from '../assets/product-galleries.mjs';

test('all swap and payment-plan entry points share the homepage shell and one consistent theme',async()=>{
 for(const route of ['swap','phone-swap','easybuy','easy-buy']){
  const d=new JSDOM(await readFile(route+'/index.html','utf8')).window.document;
  assert.equal(d.querySelectorAll('.site-header').length,1,route);assert.equal(d.querySelectorAll('.store-footer').length,1,route);assert.equal(d.querySelectorAll('h1').length,1,route);
  assert.ok(d.querySelector('.upgrade-hero'));assert.ok(d.querySelector('[data-cart-link]'));assert.ok(d.querySelector('#journey-form'));assert.ok(d.querySelector('#journey-next'));assert.ok(d.querySelector('link[href="/assets/upgrade-store.css"]'));
  assert.equal(d.querySelector('link[href="/assets/sales.css"],link[href="/assets/upgrade.css"],link[href="/assets/journey.css"],.announcement'),null,route+' must not reintroduce the older theme');
 }
});
test('only real photographs enter galleries; incomplete galleries stay off the public catalogue',async()=>{
 const {catalogueVisible}=await import('../backend/lib/catalogue-quality.mjs');
 assert.ok(storeItems.length>=293);
 for(const p of storeItems){const images=productGalleries[p.slug]||[];assert.equal(new Set(images).size,images.length,p.slug+' duplicate image');for(const src of images){assert.ok(!src.includes('/product-details/'),p.slug+' must not substitute a text card for a photo');if(src.startsWith('/'))await access('.'+src);else assert.match(src,/^https:\/\//);}if(images.length<3)assert.equal(catalogueVisible({price_kobo:100,images:[],attributes:{source_slug:p.slug}}),false,p.slug+' incomplete gallery');}
});

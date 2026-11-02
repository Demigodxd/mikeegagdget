import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';import {JSDOM} from 'jsdom';import {storeItems} from '../commerce/storefront-data.mjs';import {productGalleries} from '../assets/product-galleries.mjs';

test('all swap and payment-plan entry points share the homepage shell and one consistent theme',async()=>{
 for(const route of ['swap','phone-swap','easybuy','easy-buy']){
  const d=new JSDOM(await readFile(route+'/index.html','utf8')).window.document;
  assert.equal(d.querySelectorAll('.site-header').length,1,route);assert.equal(d.querySelectorAll('.store-footer').length,1,route);assert.equal(d.querySelectorAll('h1').length,1,route);
  assert.ok(d.querySelector('.upgrade-hero'));assert.ok(d.querySelector('[data-cart-link]'));assert.ok(d.querySelector('#journey-form'));assert.ok(d.querySelector('#journey-next'));assert.ok(d.querySelector('link[href="/assets/upgrade-store.css"]'));
  assert.equal(d.querySelector('link[href="/assets/sales.css"],link[href="/assets/upgrade.css"],link[href="/assets/journey.css"],.announcement'),null,route+' must not reintroduce the older theme');
 }
});
test('every product gallery has at least three images and each information card is labelled honestly',async()=>{
 assert.equal(storeItems.length,293);
 for(const p of storeItems){const images=productGalleries[p.slug];assert.ok(images?.length>=3,p.slug);assert.equal(new Set(images).size,images.length,p.slug+' duplicate image');for(const src of images){if(src.startsWith('/'))await access('.'+src);else assert.match(src,/^https:\/\//);if(src.startsWith('/images/product-details/')){const svg=await readFile('.'+src,'utf8');assert.match(svg,/Information card/);assert.match(svg,/product photographs appear separately/);assert.doesNotMatch(svg,/<script|<image|foreignObject/);const xml=new JSDOM(svg,{contentType:'image/svg+xml'});assert.ok(xml.window.document.querySelector('svg title'));xml.window.close();}}}
});

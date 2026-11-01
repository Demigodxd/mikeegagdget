import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {saveCart,available} from '../assets/live-catalog-core.mjs';

test('cart badge follows additions, quantity changes, removal and another tab',async()=>{
 const dom=new JSDOM('<a data-cart-link><span data-cart-count hidden></span></a>',{url:'https://lisa.example/'});
 for(const k of ['window','document','localStorage'])globalThis[k]=dom.window[k];
 await import('../assets/store-shell.js?badge-test');
 const badge=document.querySelector('[data-cart-count]');assert.equal(badge.hidden,true);
 saveCart(localStorage,[{id:'one',quantity:1}]);assert.equal(badge.textContent,'1');assert.equal(badge.hidden,false);
 saveCart(localStorage,[{id:'one',quantity:2},{id:'two',quantity:1}]);assert.equal(badge.textContent,'3');
 saveCart(localStorage,[]);assert.equal(badge.hidden,true);
 localStorage.setItem('lisa-cart',JSON.stringify([{id:'two',quantity:2}]));window.dispatchEvent(new window.Event('storage'));
 assert.equal(badge.textContent,'2');assert.equal(document.querySelector('a').getAttribute('aria-label'),'Shopping cart, 2 items');
});
test('ambiguous model listings are enquiries rather than purchasable variants',()=>{
 assert.equal(available({price_kobo:100,allow_backorder:true,attributes:{source_slug:'sony-headphone'}}),false);
 assert.equal(available({price_kobo:100,allow_backorder:true,attributes:{source_slug:'apple-pencil-2nd-gen-type-c'}}),false);
});

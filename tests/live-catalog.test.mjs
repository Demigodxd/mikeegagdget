import test from 'node:test';import assert from 'node:assert/strict';
import {available,reconcileCart,subtotal,readCart} from '../assets/live-catalog-core.mjs';
const p={id:'a',price_kobo:100000,track_stock:true,stock_quantity:2,allow_backorder:false};
test('cart uses current database prices, flags unpublished items, and caps quantity',()=>{const lines=reconcileCart([{id:'a',quantity:3,price_kobo:1},{id:'removed',quantity:1}], [{...p,price_kobo:200000}]);assert.equal(subtotal(lines),600000);assert.equal(lines[1].unavailable,true);assert.equal(reconcileCart([{id:'a',quantity:200}], [p])[0].quantity,99);});
test('sourcing remains orderable without physical stock',()=>{assert.equal(available({...p,stock_quantity:0}),false);assert.equal(available({...p,stock_quantity:0,allow_backorder:true}),true);assert.equal(available({...p,stock_quantity:0,track_stock:false}),true);assert.equal(available({...p,price_kobo:0}),false);});
test('malformed cart storage recovers to empty',()=>{assert.deepEqual(readCart({getItem:()=>'{'}),[]);assert.deepEqual(readCart({getItem:()=>'{"id":"a"}'}),[]);});

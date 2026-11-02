import test from 'node:test';import assert from 'node:assert/strict';import image from '../api/product-image.js';
const response=()=>({statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(data){this.data=data;},end(data){this.data=data;}});
test('image endpoint rejects arbitrary URLs, unknown models and invalid indexes without fetching',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;throw Error();};
 for(const query of [{model:'https://127.0.0.1/private',index:'0'},{model:'samsung-a06',index:'-1'},{model:'__proto__',index:'0'},{model:'samsung-a06',index:'99'}]){const r=response();await image({method:'GET',query},r);assert.ok(r.statusCode>=400);}
 assert.equal(calls,0);
});
test('image endpoint serves only catalogue image bytes with caching and blocks redirects',async()=>{
 let requested;globalThis.fetch=async(url,options)=>{requested={url,options};return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}});};
 const r=response();await image({method:'GET',query:{model:'samsung-a06',index:'1'}},r);
 assert.equal(r.statusCode,200);assert.equal(r.headers['Content-Type'],'image/png');assert.match(r.headers['Cache-Control'],/s-maxage/);assert.equal(requested.options.redirect,'error');assert.match(requested.url,/^https:\/\//);assert.equal(r.data.length,3);
});
test('image endpoint rejects non-image upstream responses',async()=>{
 globalThis.fetch=async()=>new Response('<html>Blocked</html>',{headers:{'content-type':'text/html'}});
 const r=response();await image({method:'GET',query:{model:'samsung-a06',index:'1'}},r);assert.equal(r.statusCode,502);
});

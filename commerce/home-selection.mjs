export function balancedHomepage(products,limit=24){
 const result=[],seen=new Set(),key=p=>p.attributes?.source_slug||p.id;
 function take(test){const p=products.find(p=>!seen.has(key(p))&&test(p));if(p){seen.add(key(p));result.push(p);}}
 for(const model of ['iphone-17-pro-max','samsung-s26-ultra','pixel-11-pro-xl','iphone-17-pro','samsung-a06','iphone-18-pro-max','samsung-a17','pixel-10-pro','iphone-17','samsung-a26'])take(p=>key(p)===model||key(p)===model+'-brand-new');
 for(const category of ['laptops','tecno','laptops','android','airpods','speakers'])take(p=>p.categories?.slug===category);
 const cycle=['iphones','samsung','pixel','tecno','laptops','android','accessories','audio'];for(let n=0;n<limit*cycle.length&&result.length<limit;n++)take(p=>p.categories?.slug===cycle[n%cycle.length]);
 for(const p of products)if(result.length<limit&&!seen.has(key(p))){seen.add(key(p));result.push(p);}return result.slice(0,limit);
}

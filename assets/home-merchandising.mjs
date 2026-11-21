import {escape} from './storefront-ui.mjs';
import {productGalleries} from './product-galleries.mjs';

// Fixed, reviewed public photo sources; the image endpoint never accepts a URL from a visitor.
export const bannerPhotos = {
 'banner-itel-super-26-ultra':['https://revenes.com/wp-content/uploads/2024/04/Itel-Super-26-Ultra-1.png'],
 'banner-macbook-air-m3':['https://ng.jumia.is/unsafe/fit-in/520x520/filters:fill(white)/product/19/8023014/1.jpg']
};
export const heroPhones = [
 ['iphone-17-pro-max','iPhone 17 Pro Max','iPhone 17'],
 ['iphone-18-pro-max','iPhone 18 Pro Max','iPhone 18'],
 ['samsung-s26-ultra','Samsung Galaxy S26 Ultra','Galaxy S26'],
 ['pixel-11-pro-xl','Google Pixel 11 Pro XL','Google Pixel'],
 ['tecno-camon-50-pro','Tecno Camon 50 Pro','Tecno'],
 ['redmi-note-17-pro-5g','Redmi Note 17 Pro 5G','Redmi'],
 ['infinix-note-60-pro','Infinix Note 60 Pro','Infinix'],
 ['banner-itel-super-26-ultra','itel Super 26 Ultra','itel']
];
const photo=(model,name,priority=false,index=0)=>{const local=productGalleries[model]?.[index];const src=local?.startsWith('/')?escape(local):`/api/product-image?model=${escape(model)}&amp;index=${index}`;return `<img src="${src}" alt="${escape(name)}" width="240" height="280" loading="${priority?'eager':'lazy'}" decoding="async"${priority?' fetchpriority="high"':''}>`;};
export function phoneDisplay(){return `<div class="phone-collection" role="group" aria-label="Explore iPhone, Samsung, Google Pixel, Tecno, Redmi, Infinix and itel"><span class="collection-kicker">FIND YOUR NEXT PHONE</span><div class="phone-lineup">${heroPhones.map(([model,name,label],i)=>`<figure class="lineup-phone" style="--device-order:${i}"><span class="phone-portrait">${photo(model,name,i<4)}</span><figcaption>${escape(label)}</figcaption></figure>`).join('')}</div><p class="collection-caption">Big possibilities. Every budget.</p></div>`;}
export function soundDisplay(){return `<div class="promo-products sound-products" aria-label="JBL speaker and Apple AirPods">${photo('jbl-charge-5','JBL Charge 5 speaker',false,1)}${photo('apple-airpods-pro-2','Apple AirPods Pro 2')}</div>`;}
export function workDisplay(){return `<div class="promo-products work-products" aria-label="MacBook, HP ZBook and iPad">${photo('banner-macbook-air-m3','Apple MacBook Air M3')}${photo('laptop-hp-zbook-8-g1i-14-inch-cm3f0uc-intel-core-ultra-7-32gb-ram-512gb-ssd-4gb-nvidia-rtx-500-ada','HP ZBook 8 G1i')}${photo('ipad-air-8th-gen-11-inch-m4','Apple iPad Air')}</div>`;}
export function categoryDisplay(id){
 if(id==='tecno')return `<span class="device-media category-tecno">${photo('tecno-camon-50-pro','Tecno Camon 50 Pro')}</span>`;
 if(id==='android')return `<span class="device-media android-collection" aria-label="Google Pixel, Samsung Galaxy and Infinix phones">${photo('pixel-11-pro-xl','Google Pixel 11 Pro XL')}${photo('samsung-s26-ultra','Samsung Galaxy S26 Ultra')}${photo('infinix-note-60-pro','Infinix Note 60 Pro')}</span>`;
 return '';
}

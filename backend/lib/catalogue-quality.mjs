import {productGalleries} from '../../assets/product-galleries.mjs';
const ambiguous=new Set(['sony-headphone','apple-pencil-2nd-gen-type-c','samsung-galaxy-watch-7-fe']);
export function productPhotos(p){const sources=p.attributes?.gallery_override?(p.images||[]):((productGalleries[p.attributes?.source_slug]||[]).length>=3?productGalleries[p.attributes.source_slug]:(p.images||[]));return [...new Set(sources.filter(u=>typeof u==='string'&&!u.includes('/product-details/')&&(/^(https:\/\/|\/images\/)/.test(u))))];}
export function catalogueVisible(p){return p.price_kobo>0&&p.attributes?.price_needs_review!==true&&!ambiguous.has(p.attributes?.source_slug)&&productPhotos(p).length>=3;}

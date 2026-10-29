import {catalogueImageUpdates,iphoneDuo} from './catalogue-image-updates.mjs';
import {commerceSite} from './catalog.mjs';
import {products as baseProducts} from './catalog.mjs';
import {retailInventory} from './retail-inventory.mjs';
import {accessoryInventory} from './accessory-inventory.mjs';
import {categoryImages} from './product-images.mjs';
import {offerProduct} from './offers.mjs';

const products=baseProducts.map(offerProduct);
const categoryOrder=['iphones','samsung','pixel','tablets','laptops','ps5','accessories','speakers','earbuds','headphones','power-banks','networking','streaming','macbooks','ipads','watches','airpods','audio','games'];
export const categories = [
 ['iphones','iPhones','Apple'],
 ['samsung','Samsung','Samsung'],
 ['pixel','Google Pixel','Google'],
 ['tablets','Samsung Tablets','Samsung'],
 ['macbooks','MacBooks','Apple'],
 ['ipads','iPads','Apple'],
 ['watches','Smartwatches','Various'],
 ['airpods','AirPods','Apple'],
 ['audio','Audio','Various'],
 ['ps5','PlayStation 5','Sony'],
 ['games','Games','Sony'],
 ['laptops','Laptops','Various'],
 ['speakers','Speakers & Music','Various'],
 ['earbuds','Earbuds','Various'],
 ['headphones','Headphones','Various'],
 ['power-banks','Power Banks','Various'],
 ['networking','Wi-Fi & Networking','Various'],
 ['streaming','TV & Streaming','Various'],
 ['accessories','Accessories','Various']
].map(([id,name,brand])=>({id,name,brand,image:accessoryInventory.find(p=>p.category===id)?.image||categoryImages[id]||'/images/lisa-logo.jpeg',route:({iphones:'/iphones',samsung:'/samsung-phones',pixel:'/google-pixel-phones'})[id] || `/shop/${id}/`}));
categories.sort((a,b)=>categoryOrder.indexOf(a.id)-categoryOrder.indexOf(b.id));
export const shopCategories = categories.filter(c=>!['iphones','samsung','pixel'].includes(c.id)).map(category => ({
 ...category,
 route: `/shop/${category.id}/`
}));

const seriesFor = model => model.match(/^iPhone (\d+)/)?.[1] || (model.startsWith('iPhone X')?'X':model.startsWith('iPhone SE')?'SE':'');
const makeVariant = v => ({
 storage:v.storage,
 price:v.price,
 regularPrice:v.regularPrice,
 offerId:v.offerId,
 ram:v.ram,
 color:v.color,
 warranty:v.warranty,
 connectivity:v.connectivity||(/wi[ -]?fi[ -]?only/i.test(v.storage)?'Wi-Fi Only':null),
 activationStatus:v.activationStatus||(/non-active/i.test(v.storage)?'Not Activated':null)
});
const phoneItems = products.map(p=>{
 const entry=retailInventory.find(item=>item.slug===p.slug);
 return {
  slug:p.slug,model:p.model,brand:p.brand,category:entry?.category||({Apple:'iphones',Samsung:'samsung',Google:'pixel'})[p.brand],
  image:p.images[0]||'',route:p.route,series:seriesFor(p.model),conditions:p.conditions,
  availability:p.stockStatus,easy:p.easyBuyEligible===true,swap:p.swapEligible===true,
  variants:p.variants.map(makeVariant)
 };
});
const whatsappFor = item => {
 const variantSummary=item.variants.map(v=>v.storage).join(', ');
 const message=`Hello Lisa Electronics, I’m interested in ${item.model} (${item.condition}). Please confirm current price, availability, variant ${variantSummary}, warranty and delivery options.`;
 return `https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(message)}`;
};
const normal = s=>s.toLowerCase().replace(/apple|[^a-z0-9]/g,'');
const importedNames=new Set(accessoryInventory.map(p=>normal(p.model)));
const otherItems = [...retailInventory.filter(item=>!item.isPhone&&!importedNames.has(normal(item.model))),...accessoryInventory].map(item=>({
 slug:item.slug,model:item.model,brand:item.brand,category:item.category,image:item.image||'',
 route:`/product/${item.slug}/`, enquiryUrl:whatsappFor(item),priceMax:item.priceMax,priceCheckedAt:item.priceCheckedAt,conditions:[item.condition],availability:'Confirm exact unit and availability',
 easy:false,swap:false,variants:item.variants.map(makeVariant)
}));
export const storeItems = [...phoneItems,...otherItems,iphoneDuo].map(item=>({...item,image:item.image||catalogueImageUpdates[item.model]||''}));

import {readConsent,privatePage,safePage} from './consent-core.mjs';
import {shoppingEvent,safeReferrer} from './shopping-analytics-core.mjs';
let starting,started=false,measurementId='',pageSent=false;
const seen=new Set();
const allowed=()=>readConsent(localStorage).analytics&&!privatePage(window.location.pathname);
function tag(){window.dataLayer.push(arguments);}
export async function startShoppingAnalytics(){
 if(!allowed())return false;if(started)return true;if(starting)return starting;
 starting=(async()=>{try{const config=await fetch('/api/config').then(r=>r.json());if(!allowed()||!/^G-[A-Z0-9]+$/.test(config.analyticsMeasurementId||''))return false;measurementId=config.analyticsMeasurementId;window.dataLayer=window.dataLayer||[];window.gtag=tag;
 tag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 tag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 tag('js',new Date());tag('config',measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:safePage(window.location.href),page_referrer:safeReferrer(document.referrer),page_title:'Lisa Electronics'});
 const script=document.createElement('script');script.async=true;script.dataset.lisaAnalytics='';script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;document.head.append(script);started=true;
 if(!pageSent){tag('event','page_view',{send_to:measurementId,page_location:safePage(window.location.href),page_title:'Lisa Electronics',page_referrer:safeReferrer(document.referrer)});pageSent=true;}
 window.dispatchEvent(new window.Event('lisa-analytics-ready'));return true;}catch{return false;}finally{starting=null;}})();return starting;
}
export async function trackShopping(name,lines,extra={}){if(!allowed())return;if(!await startShoppingAnalytics()||!allowed())return;const event=shoppingEvent(name,lines);if(!event.params.items.length)return;const key=JSON.stringify(event);if(['view_item','view_cart','begin_checkout'].includes(name)){if(seen.has(key))return;seen.add(key);}const payment=['bank_transfer','paystack'].includes(extra.payment_type)?{payment_type:extra.payment_type}:{};tag('event',event.name,{...event.params,...payment,send_to:measurementId,page_location:safePage(window.location.href)});}
export async function trackShopAction(name,params){if(!allowed()||!await startShoppingAnalytics()||!allowed())return;const permitted={};if(name==='contact_click'&&['whatsapp','instagram','phone'].includes(params.channel))permitted.channel=params.channel;else if(name==='catalogue_search'){permitted.results_count=Math.max(0,Math.floor(params.results_count)||0);permitted.search_term='[not collected]';}else return;tag('event',name,{...permitted,send_to:measurementId,page_location:safePage(window.location.href)});}
export async function checkoutAnalytics(){
 if(!allowed()||!await startShoppingAnalytics()||!allowed())return undefined;
 const get=key=>Promise.race([new Promise(resolve=>tag('get',measurementId,key,resolve)),new Promise(resolve=>setTimeout(()=>resolve(null),800))]);
 const [client_id,session_id]=await Promise.all([get('client_id'),get('session_id')]);if(!allowed()||!/^\d{1,20}\.\d{1,20}$/.test(client_id||''))return undefined;
 let token;try{token=localStorage.getItem('lisa-analytics-consent-token');if(!/^[a-f0-9]{64}$/.test(token||'')){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem('lisa-analytics-consent-token',token);}}catch{return undefined;}
 return {consent:true,client_id,session_id:/^\d{1,20}$/.test(String(session_id))?String(session_id):null,consent_token:token};
}
export function initShoppingAnalytics(){
 startShoppingAnalytics();window.addEventListener('lisa-consent-change',()=>{if(allowed()){if(measurementId)window['ga-disable-'+measurementId]=false;startShoppingAnalytics();}else if(started){window['ga-disable-'+measurementId]=true;tag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});}});
 document.addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(!a)return;let url;try{url=new URL(a.href);}catch{return;}const channel=url.hostname==='wa.me'?'whatsapp':url.hostname==='www.instagram.com'?'instagram':url.protocol==='tel:'?'phone':null;if(channel)trackShopAction('contact_click',{channel});});
}

export const CONSENT_KEY='lisa-cookie-consent';
export const CONSENT_VERSION=2;
export const CONSENT_AGE=180*24*60*60*1000;
export function readConsent(storage,now=Date.now()){
 try{const c=JSON.parse(storage.getItem(CONSENT_KEY)||'null');if(c?.version===CONSENT_VERSION&&Number.isFinite(c.updatedAt)&&c.updatedAt<=now&&now-c.updatedAt<CONSENT_AGE&&typeof c.analytics==='boolean'&&typeof c.advertising==='boolean')return c;}catch{}
 return {version:CONSENT_VERSION,analytics:false,advertising:false,updatedAt:0};
}
export function saveConsent(storage,choices,now=Date.now()){
 const c={version:CONSENT_VERSION,analytics:choices.analytics===true,advertising:choices.advertising===true,updatedAt:now};
 try{storage.setItem(CONSENT_KEY,JSON.stringify(c));storage.setItem('lisa-advertising-consent',c.advertising?'granted':'denied');}catch{}
 return c;
}
export const privatePage=path=>/^\/(admin|account|service|transfer|pickup)(\/|$)/.test(path);
export function safePage(url){try{const u=new URL(url,'https://www.lisaelectronics.com.ng');return privatePage(u.pathname)?null:'https://www.lisaelectronics.com.ng'+u.pathname;}catch{return null;}}

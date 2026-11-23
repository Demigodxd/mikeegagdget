import {CONSENT_KEY,readConsent,saveConsent} from './consent-core.mjs';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
function purgeOptionalCookies(){
 const names=document.cookie.split(';').map(x=>x.trim().split('=')[0]).filter(x=>/^(_ga($|_)|_gid$|_gat|_ttp$|_tt_enable_cookie$|_gcl_)/.test(x));
 const domains=['',window.location.hostname,'.'+window.location.hostname,'.lisaelectronics.com.ng'];
 for(const name of names)for(const domain of domains)document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'');
}
export function initConsent(){
 if(document.querySelector('[data-cookie-banner]')||window.location.pathname.startsWith('/admin'))return;
 let current=readConsent(localStorage),dialog,opener;
 const banner=el('section',null,'cookie-banner');banner.dataset.cookieBanner='';banner.setAttribute('aria-labelledby','cookie-banner-title');banner.hidden=!!current.updatedAt;
 const heading=el('h2','Your privacy, your choice');heading.id='cookie-banner-title';banner.append(heading,el('p','We use necessary storage to keep your cart and account working. With your permission, analytics helps us improve shopping and advertising cookies help us understand our campaigns. You can shop either way.'));
 const policy=el('a','Read Lisa’s privacy policy');policy.href='/privacy/#cookies';banner.append(policy);
 const actions=el('div',null,'cookie-actions'),accept=el('button','Accept optional cookies'),deny=el('button','Necessary only'),prefs=el('button','Preferences');for(const b of [accept,deny,prefs]){b.type='button';actions.append(b);}accept.className='cookie-accept';banner.append(actions);document.body.append(banner);
 async function revokePendingAttribution(){let token;try{token=localStorage.getItem('lisa-analytics-consent-token');}catch{}if(!/^[a-f0-9]{64}$/.test(token||''))return;try{const r=await fetch('/api/config?feature=analytics',{method:'POST',keepalive:true,signal:AbortSignal.timeout(5000),headers:{'Content-Type':'application/json'},body:JSON.stringify({consent_token:token})});if(r.ok)localStorage.removeItem('lisa-analytics-consent-token');}catch{}}
 async function apply(choices){const previous=readConsent(localStorage);current=saveConsent(localStorage,choices);banner.hidden=true;document.body.classList.remove('cookie-banner-open');dialog?.close();window.dispatchEvent(new window.CustomEvent('lisa-consent-change',{detail:current}));const withdrawn=(previous.analytics&&!current.analytics)||(previous.advertising&&!current.advertising);if(withdrawn){if(!current.advertising){window.ttq?.disableCookie?.();window.ttq?.revokeConsent?.();}purgeOptionalCookies();}if(!current.analytics)await revokePendingAttribution();if(withdrawn)window.location.reload();}
 accept.onclick=()=>apply({analytics:true,advertising:true});deny.onclick=()=>apply({analytics:false,advertising:false});
 function preferences(event){
  if(dialog?.open)return;opener=event?.currentTarget;current=readConsent(localStorage);dialog=el('dialog',null,'cookie-preferences');dialog.setAttribute('aria-labelledby','cookie-preferences-title');const h=el('h2','Cookie preferences');h.id='cookie-preferences-title';dialog.append(h,el('p','You are in control. Necessary storage stays on so shopping works; the optional choices below are yours.'));
  const necessary=el('section',null,'cookie-category');necessary.append(el('strong','Necessary · Always on'),el('p','Keeps your cart, sign-in, saved items and privacy choices working.'));dialog.append(necessary);
  const fields={};for(const [key,title,description]of [['analytics','Shopping analytics','Google Analytics helps Lisa understand product interest, cart activity and checkout. We do not send your contact details, passwords or payment information.'],['advertising','Advertising measurement','Advertising measurement helps Lisa understand campaign visits when Lisa’s advertising services are connected. This is separate from shopping analytics.']]){const label=el('label',null,'cookie-category'),input=el('input');input.type='checkbox';input.checked=current[key];input.setAttribute('aria-label',title);fields[key]=input;const copy=el('span');copy.append(el('strong',title),el('span',description));label.append(input,copy);dialog.append(label);}
  const buttons=el('div',null,'cookie-actions');for(const [text,fn]of [['Save my choices',()=>apply({analytics:fields.analytics.checked,advertising:fields.advertising.checked})],['Necessary only',()=>apply({analytics:false,advertising:false})],['Close',()=>dialog.close()]]){const b=el('button',text);b.type='button';b.onclick=fn;buttons.append(b);}dialog.append(buttons);dialog.addEventListener('close',()=>{dialog.remove();dialog=null;opener?.focus();});document.body.append(dialog);dialog.showModal();
 }
 prefs.onclick=preferences;document.querySelectorAll('[data-cookie-settings]').forEach(b=>b.addEventListener('click',preferences));
 if(!banner.hidden)document.body.classList.add('cookie-banner-open');
 if(!current.analytics)revokePendingAttribution();
 window.addEventListener('storage',event=>{if(event.key!==CONSENT_KEY)return;const next=readConsent(localStorage);if((current.analytics&&!next.analytics)||(current.advertising&&!next.advertising)){purgeOptionalCookies();window.location.reload();return;}current=next;banner.hidden=!!current.updatedAt;document.body.classList.toggle('cookie-banner-open',!banner.hidden);window.dispatchEvent(new window.CustomEvent('lisa-consent-change',{detail:current}));});
}

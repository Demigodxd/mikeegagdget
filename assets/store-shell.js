import {initConsent} from './consent-ui.mjs';
import {initShoppingAnalytics} from './shopping-analytics.mjs';
import {initContactWidget} from './contact-widget.js';
import {readCart} from './live-catalog-core.mjs';
export function updateCartCount(){const count=readCart(localStorage).reduce((n,l)=>n+Math.min(99,Math.max(1,Math.floor(Number(l.quantity)||1))),0);document.querySelectorAll('[data-cart-count]').forEach(el=>{el.textContent=String(count);el.hidden=count===0;});document.querySelectorAll('[data-cart-link]').forEach(el=>el.setAttribute('aria-label',`Shopping cart, ${count} ${count===1?'item':'items'}`));}
updateCartCount();window.addEventListener('storage',updateCartCount);window.addEventListener('lisa-cart-change',updateCartCount);window.addEventListener('pageshow',updateCartCount);
document.querySelector('.menu-toggle')?.addEventListener('click',e=>{e.stopImmediatePropagation();const open=e.currentTarget.getAttribute('aria-expanded')!=='true';e.currentTarget.setAttribute('aria-expanded',String(open));document.querySelector('#home-navigation')?.classList.toggle('open',open);},true);
document.querySelector('.home-catalog-search')?.addEventListener('submit',e=>{e.preventDefault();location.href='/search/?q='+encodeURIComponent(document.querySelector('#homePhoneSearch').value)+'#liveStore';});

initContactWidget();

// Change the account hint only after the customer's session is verified.
window.addEventListener('lisa-account-ready',()=>{document.querySelectorAll('.header-account').forEach(link=>{const hint=link.querySelector('[data-account-hint]');if(hint)hint.textContent='Orders & saved items';link.setAttribute('aria-label','My account, orders and saved items');});});


initConsent();
initShoppingAnalytics();

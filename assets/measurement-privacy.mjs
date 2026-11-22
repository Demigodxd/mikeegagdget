export function anonymousEvent(event){
 try{const url=new URL(event.url,'https://www.lisaelectronics.com.ng');if(/^\/(admin|account|service|transfer|pickup)(\/|$)/.test(url.pathname))return null;url.search='';url.hash='';return {...event,url:url.toString()};}catch{return null;}
}

export const customerFields = (prefix='customer') => `<fieldset class="customer-fields"><legend>Your details</legend><label>Full name<input id="${prefix}-name" autocomplete="name" maxlength="100" required></label><label>WhatsApp phone number<input id="${prefix}-phone" type="tel" autocomplete="tel" inputmode="tel" pattern="[+0-9 ()-]{7,20}" required></label><label>Delivery method<select id="${prefix}-method"><option>Pickup at Computer Village, Ikeja</option><option>Delivery</option></select></label><div id="${prefix}-delivery" hidden><label>Delivery state<input id="${prefix}-state" autocomplete="address-level1" maxlength="80" disabled></label><label>Delivery address<input id="${prefix}-address" autocomplete="street-address" maxlength="300" disabled></label></div><label>Additional notes (optional)<textarea id="${prefix}-notes" maxlength="500"></textarea></label></fieldset>`;
export function customerData(prefix='customer') {
 const get=key=>document.getElementById(`${prefix}-${key}`)?.value.trim()||'';
 return Object.fromEntries(['name','phone','method','state','address','notes'].map(key=>[key,get(key)]));
}
export function bindCustomerFields(prefix='customer') {
 const method=document.getElementById(`${prefix}-method`);
 method.addEventListener('change',()=>{
  const delivery=method.value==='Delivery';document.getElementById(`${prefix}-delivery`).hidden=!delivery;
  for(const key of ['state','address']){const field=document.getElementById(`${prefix}-${key}`);field.disabled=!delivery;field.required=delivery;}
 });
}
export function validateCustomer(prefix='customer') {
 for(const field of document.querySelectorAll(`[id^="${prefix}-"]`)){
  if(field.required&&!field.value.trim()){field.value='';field.reportValidity();return false;}
  if(field.reportValidity&&!field.reportValidity())return false;
 }
 return true;
}

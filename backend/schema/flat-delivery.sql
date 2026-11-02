-- Apply after optional-stock.sql. The fee is calculated here, never from browser totals.
create or replace function public.create_checkout_order(p_email text,p_phone text,p_items jsonb,p_method text,p_address jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare o jsonb; fee bigint:=0; a jsonb;
begin
 if p_method is null or p_method not in ('shop_pickup','delivery') then raise exception 'Invalid fulfillment method'; end if;
 if p_method='delivery' then
  if p_address is null or jsonb_typeof(p_address)<>'object' then raise exception 'Delivery address required'; end if;
  if coalesce(length(trim(p_address->>'recipient')),0) not between 2 and 150
   or coalesce(length(trim(p_address->>'street')),0) not between 5 and 500
   or coalesce(length(trim(p_address->>'city')),0) not between 2 and 150
   or coalesce(length(trim(p_address->>'state')),0) not between 2 and 150 then raise exception 'Complete the delivery address'; end if;
  fee:=700000;
  a:=jsonb_build_object('method','delivery','recipient',trim(p_address->>'recipient'),'street',trim(p_address->>'street'),'city',trim(p_address->>'city'),'state',trim(p_address->>'state'),'country','Nigeria');
 else a:='{"method":"shop_pickup"}'::jsonb;
 end if;
 o:=public.create_pickup_order(p_email,p_phone,p_items);
 update public.orders set delivery_address=a,delivery_kobo=fee,total_kobo=subtotal_kobo+fee where id=(o->>'id')::uuid;
 return o||jsonb_build_object('delivery_kobo',fee,'total_kobo',(o->>'total_kobo')::bigint+fee);
end $$;
revoke all on function public.create_checkout_order(text,text,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_checkout_order(text,text,jsonb,text,jsonb) to service_role;

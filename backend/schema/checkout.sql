create table public.admin_users(user_id uuid primary key references auth.users(id), created_at timestamptz not null default now());
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon,authenticated;
grant all on public.admin_users to service_role;
create or replace function public.create_pickup_order(p_email text,p_phone text,p_items jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare item jsonb; product public.products; oid uuid:=gen_random_uuid(); total bigint:=0; qty integer; seen uuid[]:='{}';
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Invalid cart'; end if;
 insert into orders(id,email,phone,delivery_address,subtotal_kobo,total_kobo,paystack_reference) values(oid,p_email,p_phone,'{"method":"shop_pickup"}',0,0,'lisa_'||oid);
 for item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
  if (item->>'quantity') !~ '^[1-9][0-9]?$' then raise exception 'Invalid quantity'; end if;
  qty:=(item->>'quantity')::integer;
  select * into strict product from products where id=(item->>'id')::uuid for update;
  if product.id=any(seen) or not product.published or product.price_kobo<=0 or product.stock_quantity<qty then raise exception 'Product unavailable'; end if;
  seen:=array_append(seen,product.id);
  total:=total+product.price_kobo*qty;
  update products set stock_quantity=stock_quantity-qty where id=product.id;
  insert into order_items(order_id,product_id,product_name,sku,quantity,unit_price_kobo) values(oid,product.id,product.name,product.sku,qty,product.price_kobo);
 end loop;
 update orders set subtotal_kobo=total,total_kobo=total where id=oid;
 return jsonb_build_object('id',oid,'paystack_reference','lisa_'||oid,'total_kobo',total);
end $$;
create or replace function public.confirm_payment(p_reference text,p_amount bigint,p_currency text) returns boolean language plpgsql security invoker set search_path=public as $$
declare o public.orders;
begin
 select * into strict o from orders where paystack_reference=p_reference for update;
 if o.total_kobo<>p_amount or o.currency<>p_currency then raise exception 'Payment amount or currency mismatch'; end if;
 if o.payment_status='paid' then return true; end if;
 if o.payment_status<>'pending' then raise exception 'Payment needs manual review'; end if;
 update orders set payment_status='paid',paid_at=now() where id=o.id;
 return true;
end $$;
revoke all on function public.create_pickup_order(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.confirm_payment(text,bigint,text) from public,anon,authenticated;
grant execute on function public.create_pickup_order(text,text,jsonb) to service_role;
grant execute on function public.confirm_payment(text,bigint,text) to service_role;

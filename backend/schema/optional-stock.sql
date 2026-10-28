-- Apply after commerce-foundation.sql and checkout.sql.
alter table public.products add column track_stock boolean not null default false;
alter table public.products add column allow_backorder boolean not null default true;
alter table public.order_items add column reserved_quantity integer not null default 0 check(reserved_quantity>=0);
alter table public.order_items add column sourcing_quantity integer not null default 0 check(sourcing_quantity>=0);
-- Keep allocations for existing orders created under the original stock-only policy.
update public.order_items set reserved_quantity=quantity;
alter table public.order_items add constraint order_item_allocation_check check(reserved_quantity+sourcing_quantity=quantity);
create or replace function public.create_pickup_order(p_email text,p_phone text,p_items jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare item jsonb; product public.products; oid uuid:=gen_random_uuid(); total bigint:=0; qty integer; reserved integer; seen uuid[]:='{}';
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Invalid cart'; end if;
 insert into orders(id,email,phone,delivery_address,subtotal_kobo,total_kobo,paystack_reference) values(oid,p_email,p_phone,'{"method":"shop_pickup"}',0,0,'lisa_'||oid);
 for item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
  if (item->>'quantity') !~ '^[1-9][0-9]?$' then raise exception 'Invalid quantity'; end if;
  qty:=(item->>'quantity')::integer;
  select * into strict product from products where id=(item->>'id')::uuid for update;
  if product.id=any(seen) or not product.published or product.price_kobo<=0 or (product.track_stock and not product.allow_backorder and product.stock_quantity<qty) then raise exception 'Product unavailable'; end if;
  seen:=array_append(seen,product.id);
  total:=total+product.price_kobo*qty;
  reserved:=case when product.track_stock then least(product.stock_quantity,qty) else 0 end;
  if reserved>0 then update products set stock_quantity=stock_quantity-reserved where id=product.id; end if;
  insert into order_items(order_id,product_id,product_name,sku,quantity,unit_price_kobo,reserved_quantity,sourcing_quantity) values(oid,product.id,product.name,product.sku,qty,product.price_kobo,reserved,qty-reserved);
 end loop;
 update orders set subtotal_kobo=total,total_kobo=total where id=oid;
 return jsonb_build_object('id',oid,'paystack_reference','lisa_'||oid,'total_kobo',total);
end $$;
revoke all on function public.create_pickup_order(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_pickup_order(text,text,jsonb) to service_role;

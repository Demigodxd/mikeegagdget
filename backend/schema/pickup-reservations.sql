-- Staff-reviewed pickup reservations. There is no automatic expiry policy.
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check check(payment_method in ('paystack','bank_transfer','pay_at_pickup'));
create table if not exists public.pickup_reservations(
 order_id uuid primary key references public.orders(id),reference text not null unique,
 token_hash text not null unique check(token_hash~'^[a-f0-9]{64}$'),
 customer_name text not null check(length(customer_name) between 2 and 120),pickup_date date not null,
 status text not null default 'requested' check(status in ('requested','confirmed','ready','collected','cancelled')),
 staff_note text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.pickup_reservations enable row level security;
revoke all on public.pickup_reservations from public,anon,authenticated;
grant all on public.pickup_reservations to service_role;
create index if not exists pickup_reservations_queue_idx on public.pickup_reservations(status,pickup_date);
create or replace function public.reserve_store_pickup(p_email text,p_phone text,p_name text,p_items jsonb,p_date date,p_token_hash text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare existing public.pickup_reservations;result jsonb;
begin
 if p_token_hash!~'^[a-f0-9]{64}$' or length(trim(p_name)) not between 2 and 120 or p_date is null or p_date<(now() at time zone 'Africa/Lagos')::date then raise exception 'Check your pickup details';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_token_hash,0));
 select * into existing from pickup_reservations where token_hash=p_token_hash;
 if found then return jsonb_build_object('reference',existing.reference);end if;
 result:=create_pickup_order(p_email,p_phone,p_items);
 update orders set payment_method='pay_at_pickup' where id=(result->>'id')::uuid;
 insert into pickup_reservations(order_id,reference,token_hash,customer_name,pickup_date) values((result->>'id')::uuid,result->>'paystack_reference',p_token_hash,trim(p_name),p_date);
 insert into order_audit(order_id,action) values((result->>'id')::uuid,'pickup_requested');
 return result;
end $$;
create or replace function public.review_pickup_reservation(p_actor uuid,p_order uuid,p_action text,p_note text,p_date date) returns jsonb language plpgsql security invoker set search_path=public as $$
declare o public.orders;r public.pickup_reservations;
begin
 if not exists(select 1 from admin_users where user_id=p_actor) then raise exception 'Administrator required';end if;
 select * into strict o from orders where id=p_order for update;
 select * into strict r from pickup_reservations where order_id=p_order for update;
 if o.payment_method<>'pay_at_pickup' then raise exception 'Not a pickup reservation';end if;
 if p_action=r.status then return jsonb_build_object('status',r.status);end if;
 if r.status in ('cancelled','collected') or o.payment_status<>'pending' then raise exception 'This reservation is closed';end if;
 if p_action='confirmed' then
  if r.status<>'requested' then raise exception 'Only new requests can be confirmed';end if;
 elsif p_action='ready' then
  if r.status<>'confirmed' then raise exception 'Confirm the reservation first';end if;
 elsif p_action='collected' then
  if r.status<>'ready' then raise exception 'Mark the reservation ready first';end if;
  update orders set payment_status='paid',paid_at=now(),fulfillment_status='completed' where id=p_order;
 elsif p_action='cancelled' then
  if length(trim(p_note))<3 then raise exception 'Give a cancellation reason';end if;
  update products p set stock_quantity=p.stock_quantity+x.qty from (select product_id,sum(reserved_quantity)::integer qty from order_items where order_id=p_order group by product_id) x where p.id=x.product_id and x.qty>0;
  update orders set fulfillment_status='cancelled' where id=p_order;
 elsif p_action='reschedule' then
  if p_date is null or p_date<(now() at time zone 'Africa/Lagos')::date then raise exception 'Choose a valid pickup date';end if;
  update pickup_reservations set pickup_date=p_date,staff_note=coalesce(p_note,''),updated_at=now() where order_id=p_order;
  insert into order_audit(order_id,actor_id,action,note) values(p_order,p_actor,'pickup_rescheduled',p_date::text||' '||coalesce(p_note,''));
  return jsonb_build_object('saved',true);
 else raise exception 'Invalid pickup action';end if;
 update pickup_reservations set status=p_action,staff_note=coalesce(p_note,''),updated_at=now() where order_id=p_order;
 insert into order_audit(order_id,actor_id,action,note) values(p_order,p_actor,'pickup_'||p_action,coalesce(p_note,''));
 return jsonb_build_object('status',p_action);
end $$;
revoke all on function public.reserve_store_pickup(text,text,text,jsonb,date,text),public.review_pickup_reservation(uuid,uuid,text,text,date) from public,anon,authenticated;
grant execute on function public.reserve_store_pickup(text,text,text,jsonb,date,text),public.review_pickup_reservation(uuid,uuid,text,text,date) to service_role;

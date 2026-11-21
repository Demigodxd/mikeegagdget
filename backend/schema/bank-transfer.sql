-- Separate customer claims from verified receipt; only server-side administrators can confirm.
create table if not exists public.store_settings(key text primary key,value jsonb not null);
insert into public.store_settings values('bank_transfer','{"enabled":false}') on conflict do nothing;
alter table public.store_settings enable row level security;
revoke all on public.store_settings from public,anon,authenticated;
grant all on public.store_settings to service_role;
alter table public.orders add column if not exists payment_method text not null default 'paystack' check(payment_method in ('paystack','bank_transfer'));
create table if not exists public.bank_transfers(
 order_id uuid primary key references public.orders(id), reference text unique not null,
 token_hash text unique not null check(length(token_hash)=64),bank_snapshot jsonb not null,
 sender_name text,transfer_reference text,claim_status text not null default 'awaiting_transfer' check(claim_status in ('awaiting_transfer','reported','confirmed','rejected')),
 reported_at timestamptz,reviewed_at timestamptz,reviewed_by uuid references auth.users(id),review_note text,
 created_at timestamptz not null default now()
);
create table if not exists public.order_audit(id uuid primary key default gen_random_uuid(),order_id uuid references public.orders(id),actor_id uuid references auth.users(id),action text not null,note text not null default '',created_at timestamptz not null default now());
alter table public.bank_transfers enable row level security;
alter table public.order_audit enable row level security;
revoke all on public.bank_transfers,public.order_audit from public,anon,authenticated;
grant all on public.bank_transfers,public.order_audit to service_role;
create index if not exists bank_transfers_claim_idx on public.bank_transfers(claim_status,reported_at);
create or replace function public.create_bank_order(p_email text,p_phone text,p_items jsonb,p_method text,p_address jsonb,p_token_hash text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare bank jsonb; result jsonb; existing public.bank_transfers;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_token_hash,0));
 select * into existing from bank_transfers where token_hash=p_token_hash;
 if found then return jsonb_build_object('reference',existing.reference);end if;
 select value into bank from store_settings where key='bank_transfer';
 if coalesce(bank->>'enabled','false')<>'true' or jsonb_typeof(bank->'accounts') is distinct from 'array' or jsonb_array_length(bank->'accounts')=0 then raise exception 'Bank transfer is not configured';end if;
 if p_token_hash!~'^[a-f0-9]{64}$' then raise exception 'Invalid transfer token';end if;
 result:=create_checkout_order(p_email,p_phone,p_items,p_method,p_address);
 update orders set payment_method='bank_transfer' where id=(result->>'id')::uuid;
 insert into bank_transfers(order_id,reference,token_hash,bank_snapshot) values((result->>'id')::uuid,result->>'paystack_reference',p_token_hash,bank-'enabled');
 return result;
end $$;
create or replace function public.report_bank_transfer(p_token_hash text,p_sender text,p_transfer_reference text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare t public.bank_transfers;o public.orders;
begin
 select * into strict t from bank_transfers where token_hash=p_token_hash;
 select * into strict o from orders where id=t.order_id for update;
 select * into strict t from bank_transfers where order_id=o.id for update;
 if o.payment_status='paid' then return jsonb_build_object('status','confirmed');end if;
 if o.payment_status<>'pending' or o.fulfillment_status='cancelled' or t.claim_status='rejected' then raise exception 'This order cannot accept a payment report';end if;
 if length(trim(p_sender)) not between 2 and 120 or length(p_transfer_reference)>150 then raise exception 'Invalid transfer details';end if;
 update bank_transfers set sender_name=trim(p_sender),transfer_reference=p_transfer_reference,claim_status='reported',reported_at=coalesce(reported_at,now()) where order_id=t.order_id;
 return jsonb_build_object('status','reported');
end $$;
create or replace function public.review_store_order(p_actor uuid,p_order uuid,p_action text,p_note text,p_fulfillment text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare o public.orders;t public.bank_transfers;
begin
 if not exists(select 1 from admin_users where user_id=p_actor) then raise exception 'Administrator required';end if;
 select * into strict o from orders where id=p_order for update;
 if p_action in ('confirm_transfer','reject_transfer') then
  select * into strict t from bank_transfers where order_id=p_order for update;
  if o.payment_method<>'bank_transfer' then raise exception 'Not a bank transfer';end if;
  if p_action='confirm_transfer' and o.payment_status='paid' and t.claim_status='confirmed' then return jsonb_build_object('status','paid');end if;
  if o.payment_status<>'pending' or o.fulfillment_status='cancelled' or t.claim_status<>'reported' then raise exception 'Only reported pending transfers can be reviewed';end if;
  if p_action='confirm_transfer' then
   update orders set payment_status='paid',paid_at=now() where id=p_order;
   update bank_transfers set claim_status='confirmed',reviewed_at=now(),reviewed_by=p_actor,review_note=p_note where order_id=p_order;
  else
   if length(trim(p_note))<3 then raise exception 'Enter a reason for rejection';end if;
   update bank_transfers set claim_status='rejected',reviewed_at=now(),reviewed_by=p_actor,review_note=p_note where order_id=p_order;
  end if;
 elsif p_action='fulfillment' then
  if p_fulfillment not in ('unfulfilled','processing','shipped','completed') then raise exception 'Invalid fulfillment status';end if;
  if o.payment_status<>'paid' or o.fulfillment_status='cancelled' then raise exception 'Confirm payment before fulfillment';end if;
  update orders set fulfillment_status=p_fulfillment where id=p_order;
 else raise exception 'Invalid order action';end if;
 insert into order_audit(order_id,actor_id,action,note) values(p_order,p_actor,p_action,coalesce(p_note,''));
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.create_bank_order(text,text,jsonb,text,jsonb,text),public.report_bank_transfer(text,text,text),public.review_store_order(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.create_bank_order(text,text,jsonb,text,jsonb,text),public.report_bank_transfer(text,text,text),public.review_store_order(uuid,uuid,text,text,text) to service_role;

create table if not exists public.checkout_limits(key text primary key,attempts integer not null default 0,window_start timestamptz not null default now());
alter table public.checkout_limits enable row level security;
revoke all on public.checkout_limits from public,anon,authenticated;
grant all on public.checkout_limits to service_role;
create or replace function public.allow_checkout(p_key text) returns boolean language plpgsql security invoker set search_path=public as $$
declare attempts_now integer;
begin
 insert into checkout_limits(key,attempts) values(p_key,1) on conflict(key) do update set attempts=case when checkout_limits.window_start<now()-interval '1 hour' then 1 else checkout_limits.attempts+1 end,window_start=case when checkout_limits.window_start<now()-interval '1 hour' then now() else checkout_limits.window_start end returning attempts into attempts_now;
 return attempts_now<=10;
end $$;
revoke all on function public.allow_checkout(text) from public,anon,authenticated;
grant execute on function public.allow_checkout(text) to service_role;

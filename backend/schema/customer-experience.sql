-- Private customer operations. All requests go through authenticated server endpoints.
create table if not exists public.customer_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null default '{"saved":[],"cart":[],"addresses":[]}',
 revision integer not null default 1, updated_at timestamptz not null default now()
);
create table if not exists public.product_reviews (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 order_id uuid not null references public.orders(id), product_id uuid not null references public.products(id),
 display_name text not null check(length(display_name) between 2 and 60), rating integer not null check(rating between 1 and 5),
 comment text not null check(length(comment) between 10 and 2000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), unique(order_id,product_id)
);
create table if not exists public.support_tickets (
 id uuid primary key default gen_random_uuid(), reference text not null unique,
 order_id uuid not null references public.orders(id), token_hash text unique not null,
 topic text not null check(length(topic) between 2 and 100), details text not null check(length(details) between 10 and 2000),
 status text not null default 'received' check(status in ('received','in_review','awaiting_customer','repairing','resolved')),
 updates jsonb not null default '[]', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_delivery_updates (
 order_id uuid primary key references public.orders(id),
 estimated_date date, carrier text not null default '', tracking_number text not null default '',
 customer_note text not null default '', updated_at timestamptz not null default now()
);
create table if not exists public.notification_outbox (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 event text not null, payload jsonb not null default '{}',
 status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
 attempts integer not null default 0, available_at timestamptz not null default now(), sent_at timestamptz,
 created_at timestamptz not null default now(), last_error text
);
create index if not exists reviews_product_status on public.product_reviews(product_id,status);
create index if not exists tickets_order on public.support_tickets(order_id);
create index if not exists notification_pending on public.notification_outbox(status,available_at);
alter table public.customer_preferences enable row level security;
alter table public.product_reviews enable row level security;
alter table public.support_tickets enable row level security;
alter table public.order_delivery_updates enable row level security;
alter table public.notification_outbox enable row level security;
revoke all on public.customer_preferences,public.product_reviews,public.support_tickets,public.order_delivery_updates,public.notification_outbox from public,anon,authenticated;
grant all on public.customer_preferences,public.product_reviews,public.support_tickets,public.order_delivery_updates,public.notification_outbox to service_role;

create or replace function public.save_customer_preferences(p_user uuid,p_state jsonb,p_revision integer)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare result public.customer_preferences;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into result from customer_preferences where user_id=p_user;
 if found then
  if result.revision<>p_revision then raise exception 'SYNC_CONFLICT'; end if;
  update customer_preferences set state=p_state,revision=revision+1,updated_at=now() where user_id=p_user returning * into result;
 else
  if p_revision<>0 then raise exception 'SYNC_CONFLICT'; end if;
  insert into customer_preferences(user_id,state) values(p_user,p_state) returning * into result;
 end if;
 return jsonb_build_object('state',result.state,'revision',result.revision);
end $$;
revoke all on function public.save_customer_preferences(uuid,jsonb,integer) from public,anon,authenticated;
grant execute on function public.save_customer_preferences(uuid,jsonb,integer) to service_role;

create or replace function public.queue_order_update() returns trigger language plpgsql security invoker set search_path=public as $$
declare label text;
begin
 if TG_OP='INSERT' then label:='order_placed';
 elsif new.payment_status is distinct from old.payment_status then label:='payment_'||new.payment_status;
 elsif new.fulfillment_status is distinct from old.fulfillment_status then label:='order_'||new.fulfillment_status;
 else return new; end if;
 insert into notification_outbox(order_id,event,payload) values(new.id,label,jsonb_build_object('payment',new.payment_status,'fulfillment',new.fulfillment_status));
 return new;
end $$;
revoke all on function public.queue_order_update() from public,anon,authenticated;
drop trigger if exists lisa_order_notifications on public.orders;
create trigger lisa_order_notifications after insert or update of payment_status,fulfillment_status on public.orders for each row execute function public.queue_order_update();

create or replace function public.claim_customer_notifications() returns setof public.notification_outbox language sql security invoker set search_path=public as $$
 update notification_outbox set status='sending',attempts=attempts+1,available_at=now()+interval '5 minutes'
 where id in (select id from notification_outbox where ((status in ('pending','failed') and available_at<=now()) or (status='sending' and available_at<=now())) and attempts<6 order by created_at for update skip locked limit 3)
 returning *;
$$;
revoke all on function public.claim_customer_notifications() from public,anon,authenticated;
grant execute on function public.claim_customer_notifications() to service_role;

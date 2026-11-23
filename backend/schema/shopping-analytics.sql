-- Only the server can access consenting checkout attribution.
create table if not exists public.analytics_attributions (
 order_id uuid primary key references public.orders(id) on delete cascade,
 client_id text not null check(client_id ~ '^[0-9]{1,20}\.[0-9]{1,20}$'),
 session_id text check(session_id ~ '^[0-9]{1,20}$'),
 consent_token_hash text not null check(consent_token_hash ~ '^[a-f0-9]{64}$'),
 status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
 attempts integer not null default 0, available_at timestamptz not null default now(),
 created_at timestamptz not null default now(), sent_at timestamptz, last_error text
);
create index if not exists analytics_consent_token on public.analytics_attributions(consent_token_hash);
create index if not exists analytics_pending on public.analytics_attributions(status,available_at);
alter table public.analytics_attributions enable row level security;
revoke all on public.analytics_attributions from public,anon,authenticated;
grant all on public.analytics_attributions to service_role;

create or replace function public.claim_analytics_purchases() returns setof public.analytics_attributions
language plpgsql security invoker set search_path=public as $$
begin
 delete from analytics_attributions where created_at < now()-interval '60 days' or sent_at < now()-interval '30 days';
 return query with due as (
 select a.order_id from analytics_attributions a join orders o on o.id=a.order_id
 where o.payment_status='paid' and a.attempts<8 and a.available_at<=now()
 and (a.status in ('pending','failed') or (a.status='sending' and a.available_at<now()))
 order by a.created_at for update of a skip locked limit 10
 ) update analytics_attributions a set status='sending',attempts=a.attempts+1,available_at=now()+interval '10 minutes'
 from due where a.order_id=due.order_id returning a.*;
end $$;
revoke all on function public.claim_analytics_purchases() from public,anon,authenticated;
grant execute on function public.claim_analytics_purchases() to service_role;

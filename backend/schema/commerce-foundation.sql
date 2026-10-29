
create table public.categories (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 name text not null, created_at timestamptz not null default now()
);
create table public.products (
 id uuid primary key default gen_random_uuid(), sku text not null unique,
 slug text not null unique, name text not null, description text not null default '',
 category_id uuid references public.categories(id),
 price_kobo bigint not null check(price_kobo>=0),
 currency text not null default 'NGN' check(currency='NGN'),
 stock_quantity integer not null default 0 check(stock_quantity>=0),
 images jsonb not null default '[]'::jsonb check(jsonb_typeof(images)='array'),
 attributes jsonb not null default '{}'::jsonb check(jsonb_typeof(attributes)='object'),
 published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create table public.orders (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid references auth.users(id) on delete set null,
 email text not null, phone text not null, delivery_address jsonb not null default '{}'::jsonb,
 subtotal_kobo bigint not null check(subtotal_kobo>=0),
 delivery_kobo bigint not null default 0 check(delivery_kobo>=0),
 total_kobo bigint not null check(total_kobo=subtotal_kobo+delivery_kobo),
 currency text not null default 'NGN' check(currency='NGN'),
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded')),
 fulfillment_status text not null default 'unfulfilled' check(fulfillment_status in ('unfulfilled','processing','shipped','completed','cancelled')),
 paystack_reference text unique, paid_at timestamptz,
 created_at timestamptz not null default now()
);
create index orders_customer_idx on public.orders(customer_id);
create table public.order_items (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id),
 product_id uuid not null references public.products(id),
 product_name text not null, sku text not null,
 quantity integer not null check(quantity>0),
 unit_price_kobo bigint not null check(unit_price_kobo>=0)
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.categories,public.products,public.orders,public.order_items from anon,authenticated;
grant select on public.categories,public.products to anon,authenticated;
grant all on public.categories,public.products,public.orders,public.order_items to service_role;
create policy categories_public_read on public.categories for select to anon,authenticated using(true);
create policy published_products_read on public.products for select to anon,authenticated using(published=true);
comment on table public.orders is 'Server-only access. Verify Paystack signature, reference, amount and currency before marking paid. Never accept browser-supplied totals.';

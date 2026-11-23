create table if not exists public.product_sources(product_id uuid primary key references public.products(id),source_record jsonb not null,created_at timestamptz not null default now());
alter table public.product_sources enable row level security;
revoke all on public.product_sources from public,anon,authenticated;
grant all on public.product_sources to service_role;
insert into public.categories(slug,name) values('tecno','Tecno'),('android','More Android phones') on conflict(slug) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-photos','product-photos',true,2621440,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do nothing;

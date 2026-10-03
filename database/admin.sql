-- Only a verified account explicitly reserved by the store owner can administer products.
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to authenticated;
create table if not exists private.store_admins (
 email text primary key check(email=lower(email)),
 created_at timestamptz not null default now()
);
alter table private.store_admins enable row level security;
revoke all on private.store_admins from public,anon,authenticated;
insert into private.store_admins(email) values('sunduszafar38@gmail.com') on conflict do nothing;
create or replace function private.is_store_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join private.store_admins a on a.email=lower(u.email)
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null);
$$;
revoke all on function private.is_store_admin() from public,anon,authenticated;
grant execute on function private.is_store_admin() to authenticated;
create or replace function public.is_store_admin() returns boolean
language sql stable security invoker set search_path='' as $$select private.is_store_admin();$$;
revoke all on function public.is_store_admin() from public,anon,authenticated;
grant execute on function public.is_store_admin() to authenticated;
grant insert,update on public.products to authenticated;
create policy "Admins read full catalog" on public.products for select to authenticated using((select private.is_store_admin()));
create policy "Admins add products" on public.products for insert to authenticated with check((select private.is_store_admin()));
create policy "Admins edit products" on public.products for update to authenticated using((select private.is_store_admin())) with check((select private.is_store_admin()));
-- Public product photos; uploading is limited to the verified admin. No SVG/HTML uploads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Admins upload product photos" on storage.objects for insert to authenticated
with check(bucket_id='product-images' and (select private.is_store_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Admins inspect product photos" on storage.objects for select to authenticated
using(bucket_id='product-images' and (select private.is_store_admin()));
-- Product editing uses plain text, not markup, as the existing storefront renders text fields.
create or replace function public.validate_catalog_product() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.id !~ '^[a-z0-9][a-z0-9-]{0,119}$' or length(new.name) not between 1 and 160
 or length(new.sku) not between 1 and 100 or length(new.brand) not between 1 and 100
 or length(new.category) not between 1 and 100 or length(new.description) not between 1 and 5000
 or (new.name||new.sku||new.brand||new.category||new.description||new.badge||new.features::text||new.specs::text||new.colors::text) ~ '[<>]'
 or new.image !~ '^(https://[^[:space:]<>"'']+|assets/catalog/[a-zA-Z0-9_.-]+\.(webp|png|jpg|jpeg))$'
 or jsonb_typeof(new.gallery)<>'array' or jsonb_typeof(new.features)<>'array'
 or jsonb_typeof(new.colors)<>'array' or jsonb_typeof(new.specs)<>'object'
 or exists(select 1 from jsonb_array_elements_text(new.gallery) x where x !~ '^(https://[^[:space:]<>"'']+|assets/catalog/[a-zA-Z0-9_.-]+\.(webp|png|jpg|jpeg))$')
 then raise exception 'Product details must use valid plain text and HTTPS image URLs'; end if;
 return new;
end $$;
revoke all on function public.validate_catalog_product() from public,anon,authenticated;
create trigger validate_catalog_product before insert or update on public.products for each row execute function public.validate_catalog_product();
create policy "Allowlist managed by database owner only" on private.store_admins for all to authenticated using(false) with check(false);

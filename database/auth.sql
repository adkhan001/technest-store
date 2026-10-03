create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 details jsonb not null default '{}' check(jsonb_typeof(details)='object'),
 saved_items jsonb not null default '[]' check(jsonb_typeof(saved_items)='array'),
 recent_items jsonb not null default '[]' check(jsonb_typeof(recent_items)='array'),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select,insert,update on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy "Read own profile" on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy "Create own profile" on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy "Update own profile" on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
alter table public.orders add column user_id uuid references auth.users(id) on delete set null;
create index orders_user_created_idx on public.orders(user_id,created_at desc);
grant select on public.orders to authenticated;
create policy "Read own orders" on public.orders for select to authenticated using ((select auth.uid())=user_id);
create or replace function public.place_store_order(payload jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare
 line jsonb; prod public.products; quantity integer; lines jsonb='[]'; subtotal numeric=0; reduction numeric=0; shipping numeric; created public.orders; customer jsonb=payload->'customer';
begin
 if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 30 then raise exception 'Invalid cart'; end if;
 if customer is null or length(customer->>'email') not between 5 and 254 then raise exception 'Delivery details required'; end if;
 -- Reject duplicate product rows and lock products in stable order to prevent overselling/deadlocks.
 if (select count(*) from jsonb_array_elements(payload->'items')) <> (select count(distinct value->>'id') from jsonb_array_elements(payload->'items')) then raise exception 'Duplicate products'; end if;
 for line in select value from jsonb_array_elements(payload->'items') order by value->>'id' loop
  quantity=(line->>'qty')::integer;
  if quantity not between 1 and 10 then raise exception 'Quantity must be between 1 and 10'; end if;
  select * into prod from public.products where id=line->>'id' and active for update;
  if not found then raise exception 'Product unavailable'; end if;
  if prod.stock<quantity then raise exception 'Insufficient stock for %',prod.name; end if;
  update public.products set stock=stock-quantity where id=prod.id;
  subtotal=subtotal+prod.price*quantity;
  lines=lines||jsonb_build_array(jsonb_build_object('id',prod.id,'name',prod.name,'image',prod.image,'qty',quantity,'price',prod.price,'opts',jsonb_build_object('color','As pictured','storage','Standard')));
 end loop;
 if payload->>'coupon'='TECH10' then reduction=round(subtotal*.10,2); end if;
 shipping=case when payload->>'delivery'='express' then 34.95 when subtotal-reduction>=250 then 0 else 19.95 end;
 insert into public.orders(user_id,customer,items,subtotal,discount,shipping,total,delivery) values(nullif(payload->>'user_id','')::uuid,customer,lines,subtotal,reduction,shipping,subtotal-reduction+shipping,coalesce(payload->>'delivery','standard')) returning * into created;
 return jsonb_build_object('id',created.reference,'token',created.tracking_token,'date',created.created_at,'items',created.items,'status',created.status,'payment',created.payment,'delivery',created.delivery,'subtotal',created.subtotal,'discount',created.discount,'shipping',created.shipping,'total',created.total);
end $$;

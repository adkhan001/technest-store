create table public.products (
 id text primary key, sku text not null unique, name text not null, brand text not null,
 category text not null, price numeric(12,2) not null check(price>0), stock integer not null default 12 check(stock>=0),
 image text not null, gallery jsonb not null default '[]', description text not null,
 features jsonb not null default '[]', specs jsonb not null default '{}', colors jsonb not null default '["As pictured"]',
 badge text not null default '', arrival integer not null default 0, active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), reference text not null unique default ('TN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 tracking_token uuid not null default gen_random_uuid(), customer jsonb not null, items jsonb not null,
 subtotal numeric(12,2) not null, discount numeric(12,2) not null default 0, shipping numeric(12,2) not null,
 total numeric(12,2) not null, status text not null default 'Order received' check(status in ('Order received','Preparing order','Packed','Out for delivery','Delivered','Cancelled')),
 delivery text not null check(delivery in ('standard','express')), payment text not null default 'cod' check(payment='cod'),
 created_at timestamptz not null default now()
);
create table public.contact_messages(id uuid primary key default gen_random_uuid(),name text not null,email text not null,subject text,message text not null,created_at timestamptz not null default now());
create table public.newsletter_subscribers(id uuid primary key default gen_random_uuid(),email text not null unique,created_at timestamptz not null default now());
create index products_category_idx on public.products(category);
create index orders_created_idx on public.orders(created_at);
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
create policy "Read active catalog" on public.products for select to anon,authenticated using(active=true);
revoke all on public.products,public.orders,public.contact_messages,public.newsletter_subscribers from anon,authenticated;
grant select on public.products to anon,authenticated;
grant all on public.products,public.orders,public.contact_messages,public.newsletter_subscribers to service_role;
-- Only the authenticated backend can call this transaction. Prices and stock come from Postgres.
create function public.place_store_order(payload jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
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
 insert into public.orders(customer,items,subtotal,discount,shipping,total,delivery) values(customer,lines,subtotal,reduction,shipping,subtotal-reduction+shipping,coalesce(payload->>'delivery','standard')) returning * into created;
 return jsonb_build_object('id',created.reference,'token',created.tracking_token,'date',created.created_at,'items',created.items,'status',created.status,'payment',created.payment,'delivery',created.delivery,'subtotal',created.subtotal,'discount',created.discount,'shipping',created.shipping,'total',created.total);
end $$;
revoke all on function public.place_store_order(jsonb) from public,anon,authenticated;
grant execute on function public.place_store_order(jsonb) to service_role;

create policy "Backend access only" on public.orders for all to anon,authenticated using(false) with check(false);
create policy "Backend access only" on public.contact_messages for all to anon,authenticated using(false) with check(false);
create policy "Backend access only" on public.newsletter_subscribers for all to anon,authenticated using(false) with check(false);

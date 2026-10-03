-- Execute as database owner in a transaction. All fixtures and changes roll back.
begin;
update private.store_admins set email='admin-permission-test@example.com' where email='sunduszaffar9@gmail.com';
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values('ecf2faf9-699a-44da-884a-a90ed0f01b01','admin-permission-test@example.com',now(),'{}','{}');
select set_config('request.jwt.claim.sub','ecf2faf9-699a-44da-884a-a90ed0f01b01',true);
set local role authenticated;
do $$begin
 if not public.is_store_admin() then raise exception 'Verified admin authorization failed'; end if;
 insert into public.products(id,sku,name,brand,category,price,stock,image,description,active)
 values('admin-permission-test','ADMIN-PERMISSION-TEST','Permission test','TechNest','Accessories',10,2,'https://example.com/test.jpg','Temporary permission test',false);
 update public.products set stock=3 where id='admin-permission-test';
 if not exists(select 1 from public.products where id='admin-permission-test' and stock=3 and not active) then raise exception 'Admin cannot edit hidden products'; end if;
 insert into storage.objects(bucket_id,name) values('product-images','ecf2faf9-699a-44da-884a-a90ed0f01b01/permission-test.jpg');
 begin
  update public.products set description='<script>alert(1)</script>' where id='admin-permission-test';
  raise exception 'Markup validation failed';
 exception when raise_exception then if sqlerrm='Markup validation failed' then raise; end if; end;
end$$;
reset role;
update auth.users set email_confirmed_at=null where id='ecf2faf9-699a-44da-884a-a90ed0f01b01';
set local role authenticated;
do $$begin if public.is_store_admin() then raise exception 'Unverified email was authorized'; end if; end$$;
reset role;
select set_config('request.jwt.claim.sub','b5a2e2a2-7154-4084-a2d1-f0235e3c47f7',true);
set local role authenticated;
do $$declare affected integer; begin
 if public.is_store_admin() then raise exception 'Ordinary account was authorized'; end if;
 begin
 insert into public.products(id,sku,name,brand,category,price,stock,image,description)
 values('shopper-permission-test','SHOPPER-PERMISSION-TEST','Forbidden','Test','Accessories',10,1,'https://example.com/test.jpg','Temporary');
 raise exception 'Shopper product insert was allowed';
 exception when insufficient_privilege then null; end;
 update public.products set stock=99 where id='admin-permission-test';get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Shopper product update was allowed'; end if;
 begin
 insert into storage.objects(bucket_id,name) values('product-images','b5a2e2a2-7154-4084-a2d1-f0235e3c47f7/forbidden.jpg');
 raise exception 'Shopper photo upload was allowed';
 exception when insufficient_privilege then null; end;
 begin
 insert into private.store_admins(email) values('shopper@example.com');
 raise exception 'Shopper self-promotion was allowed';
 exception when insufficient_privilege then null; end;
end$$;
reset role;
set local role anon;
do $$begin
 if exists(select 1 from public.products where id='admin-permission-test') then raise exception 'Hidden product visible to shoppers'; end if;
end$$;
reset role;
select 'PASS: verified admin CRUD/upload; unverified, shopper, and anonymous access denied; markup blocked' as result;
rollback;

import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const allowed=new Set(['https://technest-store-xydb.vercel.app','http://localhost:8000','http://127.0.0.1:8000']);
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const cors={'Access-Control-Allow-Origin':allowed.has(origin)?origin:'https://technest-store-xydb.vercel.app','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 if(origin&&!allowed.has(origin))return reply({error:'Origin not allowed'},403);
 // JWT verification is enforced by the Supabase gateway. The service key stays inside this function.
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 try{
  const text=await req.text();if(text.length>24000)return reply({error:'Request too large'},413);
  const b=JSON.parse(text);const email=(x:unknown)=>typeof x==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)&&x.length<=254;
  if(b.action==='checkout'){
   const c=b.customer||{};
   for(const key of ['first','last','email','phone','address','city','state','zip'])if(typeof c[key]!=='string'||!c[key].trim()||c[key].length>300)return reply({error:'Complete your delivery details'},400);
   if(!email(c.email))return reply({error:'Enter a valid email'},400);
   if(!['standard','express'].includes(b.delivery)||b.payment!=='cod')return reply({error:'Invalid delivery or payment method'},400);
   const clean=Object.fromEntries(['first','last','email','phone','address','city','state','zip','note'].map(k=>[k,String(c[k]||'').trim().slice(0,300)]));
   clean.email=clean.email.toLowerCase();
   const {count,error:rateError}=await db.from('orders').select('id',{count:'exact',head:true}).eq('customer->>email',clean.email).gte('created_at',new Date(Date.now()-3600000).toISOString());
   if(rateError)throw rateError;if((count||0)>=8)return reply({error:'Too many orders. Please try later.'},429);
   const {data,error}=await db.rpc('place_store_order',{payload:{customer:clean,items:b.items,coupon:b.coupon,delivery:b.delivery}});
   if(error)return reply({error:error.message},400);return reply({order:data});
  }
  if(b.action==='track'){
   if(typeof b.reference!=='string'||!/^TN-[A-F0-9]{12}$/.test(b.reference)||typeof b.token!=='string'||!/^[a-f0-9-]{36}$/.test(b.token))return reply({error:'Order reference and tracking key required'},400);
   const {data,error}=await db.from('orders').select('reference,created_at,status,items,total,payment,delivery,subtotal,shipping,discount').eq('reference',b.reference).eq('tracking_token',b.token).maybeSingle();
   if(error)throw error;if(!data)return reply({error:'Order not found. Check your reference and tracking key.'},404);
   return reply({order:{...data,id:data.reference,date:data.created_at,token:b.token}});
  }
  if(b.action==='contact'){
   if(!email(b.email)||typeof b.name!=='string'||b.name.length<2||b.name.length>100||typeof b.message!=='string'||b.message.length<10||b.message.length>3000)return reply({error:'Enter your name, valid email and a message of 10–3000 characters'},400);
   const {count}=await db.from('contact_messages').select('id',{count:'exact',head:true}).eq('email',b.email.toLowerCase()).gte('created_at',new Date(Date.now()-3600000).toISOString());
   if((count||0)>=5)return reply({error:'Please wait before sending another message'},429);
   const {error}=await db.from('contact_messages').insert({name:b.name,email:b.email.toLowerCase(),subject:String(b.subject||'').slice(0,200),message:b.message});if(error)throw error;return reply({success:true});
  }
  if(b.action==='subscribe'){
   if(!email(b.email))return reply({error:'Enter a valid email address'},400);
   const {error}=await db.from('newsletter_subscribers').upsert({email:b.email.toLowerCase()},{onConflict:'email',ignoreDuplicates:true});if(error)throw error;return reply({success:true});
  }
  return reply({error:'Unknown action'},400);
 }catch(_){return reply({error:'Unable to complete the request. Please try again.'},500)}
});

/* Only public API keys live here. Privileged operations run in the Supabase function. */
window.TNBackend={
 url:'https://uuxooytzjpkmosqzbgrm.supabase.co',
 key:'sb_publishable_Y1gr-dwEtrkJvq4IYvRtYg_HCQjY6m5',
 gatewayKey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1eG9veXR6anBrbW9zcXpiZ3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMTQ4MjIsImV4cCI6MjEwNjU5MDgyMn0.NOuYZAQGtajgcXW9IrtV2UJrjHqGnv_Ax0t8RDSoa3o',
 connected:false,
 async request(body){
  await window.TNAuth?.ready;const token=window.TNAuth?.session?.access_token;
  const response=await fetch(this.url+'/functions/v1/store-api',{method:'POST',headers:{'Content-Type':'application/json',apikey:this.gatewayKey,Authorization:'Bearer '+this.gatewayKey,...(token?{'x-user-token':token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to reach the store');return result;
 },
 async catalog(){
  const response=await fetch(this.url+'/rest/v1/products?select=*&order=category.asc,name.asc',{headers:{apikey:this.key},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Catalog temporarily unavailable');const rows=await response.json();if(!rows.length)throw new Error('Catalog unavailable');
  window.TN_PRODUCTS=rows.map(p=>({...p,price:Number(p.price),desc:p.description,oldPrice:null,rating:0,reviews:0,deal:false,fallback:p.image}));
  window.TN_CATEGORIES=[...new Set(TN_PRODUCTS.map(p=>p.category))];window.TN_CATEGORY_COUNTS=Object.fromEntries(TN_CATEGORIES.map(c=>[c,TN_PRODUCTS.filter(p=>p.category===c).length]));this.connected=true;return rows;
 }
};
TNBackend.ready=TNBackend.catalog().catch(error=>{console.warn(error.message);return null});
document.addEventListener('DOMContentLoaded',async()=>{
 await TNBackend.ready;
 const valid=new Set(TN_PRODUCTS.map(p=>p.id));TNStore.data.cart=Object.fromEntries(Object.entries(TNStore.data.cart).filter(([,item])=>valid.has(item.id)));TNStore.data.wishlist=TNStore.data.wishlist.filter(id=>valid.has(id));TNStore.data.compare=TNStore.data.compare.filter(id=>valid.has(id));
 if(window.TNRenderHeader)TNRenderHeader(window.TN_ACTIVE||'');
 if(!TNBackend.connected){const warning=document.createElement('div');warning.className='backend-alert';warning.textContent='Showing the saved catalog. Checkout requires a connection to the store.';document.getElementById('site-header')?.append(warning)}
 document.querySelectorAll('label').forEach(label=>{const field=label.parentElement.querySelector('input:not([type=radio]):not([type=checkbox]),textarea,select');if(field){if(!field.id)field.id='field-'+Math.random().toString(36).slice(2);label.htmlFor=field.id}});
});

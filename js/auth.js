/* Supabase manages passwords and sessions. RLS protects each user's private records. */
window.TNAuth={
 client:supabase.createClient(TNBackend.url,TNBackend.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}),
 session:null,hydrating:false,scope:null,generation:0,recovery:false,
 async accept(session){
  this.session=session;const id=session?.user.id||null;
  if(this.scope===id)return this.pending;
  this.scope=id;const generation=++this.generation;this.hydrating=true;clearTimeout(this.syncTimer);TNStore.switchUser(id);
  this.pending=(async()=>{
   try{if(id){
    const {data,error}=await this.client.from('profiles').select('*').eq('id',id).maybeSingle();if(error)throw error;
    const defaults={first:session.user.user_metadata?.first||'',last:session.user.user_metadata?.last||''};
    if(!data){const {error}=await this.client.from('profiles').insert({id,details:defaults});if(error)throw error;}
    const {data:orders,error:orderError}=await this.client.from('orders').select('reference,tracking_token,created_at,status,items,subtotal,discount,shipping,total,payment,delivery').order('created_at',{ascending:false});if(orderError)throw orderError;
    if(generation!==this.generation)return;
    TNStore.data.profile={...(data?.details||defaults),email:session.user.email};
    const valid=new Set(TN_PRODUCTS.map(p=>p.id));TNStore.data.wishlist=(data?.saved_items||[]).filter(x=>valid.has(x));TNStore.data.recent=(data?.recent_items||[]).filter(x=>valid.has(x));
    TNStore.data.orders=(orders||[]).map(o=>({...o,id:o.reference,token:o.tracking_token,date:o.created_at,total:Number(o.total)}));TNStore.save();
   }}finally{if(generation===this.generation){this.hydrating=false;if(window.TNRenderHeader)TNRenderHeader(window.TN_ACTIVE||'');document.dispatchEvent(new CustomEvent('tn:auth'));}}
  })();return this.pending;
 },
 async saveProfile(profile){
  if(!this.session)throw new Error('Sign in to save your profile');
  const details=Object.fromEntries(['first','last','phone','address','city','state','zip'].map(k=>[k,String(profile[k]||'').trim().slice(0,300)]));
  const {error}=await this.client.from('profiles').upsert({id:this.session.user.id,details,updated_at:new Date().toISOString()},{onConflict:'id'});if(error)throw error;
  TNStore.saveProfile({...details,email:this.session.user.email});
 },
 async syncPreferences(id){
  if(this.hydrating||id!==this.session?.user.id)return;
  const saved_items=[...TNStore.data.wishlist],recent_items=[...TNStore.data.recent];
  const {error}=await this.client.from('profiles').update({saved_items,recent_items,updated_at:new Date().toISOString()}).eq('id',id);if(error)TNToast('Could not sync saved products. Please try again.','error');
 }
};
TNAuth.ready=(async()=>{const {data,error}=await TNAuth.client.auth.getSession();if(error)throw error;TNAuth.scope=undefined;await TNAuth.accept(data.session);})();
TNAuth.client.auth.onAuthStateChange((event,session)=>{
 if(event==='PASSWORD_RECOVERY')TNAuth.recovery=true;
 if(event==='TOKEN_REFRESHED'){TNAuth.session=session;return;}
 if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED','PASSWORD_RECOVERY'].includes(event))setTimeout(()=>{TNAuth.accept(session).catch(error=>{console.warn('Account load failed');document.dispatchEvent(new CustomEvent('tn:auth-error',{detail:error.message}))});},0);
});
document.addEventListener('tn:state',()=>{if(!TNAuth.session||TNAuth.hydrating)return;clearTimeout(TNAuth.syncTimer);const id=TNAuth.session.user.id;TNAuth.syncTimer=setTimeout(()=>TNAuth.syncPreferences(id),500);});

/* Product writes and image uploads are authorized by database/storage RLS. */
document.addEventListener('DOMContentLoaded',async()=>{
 const status=document.getElementById('admin-status'),app=document.getElementById('admin-app'),db=TNAuth.client;
 let products=[],editing=null,generation=0,busy=false;
 const escape=TNU.escape;
 const access=(title,text,signin=false)=>{app.classList.add('hidden');status.innerHTML=`<div class="admin-access"><span class="eyebrow">PRODUCT STUDIO</span><h2>${title}</h2><p class="muted">${text}</p><a class="btn btn-primary" href="${signin?'account.html?next=admin':'account.html'}">${signin?'Sign in / create account':'Back to your account'}</a></div>`;};
 const field=(name,label,value='',type='text',extra='')=>`<div class="field"><label for="admin-${name}">${label}</label><input class="input" id="admin-${name}" name="${name}" type="${type}" value="${escape(String(value))}" ${extra}></div>`;
 const lines=x=>(x||[]).join('\n');
 function editor(product=null){
  editing=product;const p=product||{stock:1,price:'',active:true};
  document.getElementById('admin-editor').innerHTML=`<span class="eyebrow">${product?'EDIT COLLECTION':'BUILD THE COLLECTION'}</span><h2>${product?'Edit product':'Add a product'}</h2><p class="muted">${product?'Changes update the live store.':'Add the details shoppers need to choose confidently.'}</p><form id="product-form">${field('name','Product name',p.name||'','text','required maxlength="160"')}
  <div class="form-row">${field('brand','Brand',p.brand||'','text','required maxlength="100"')}${field('category','Category',p.category||'','text','required maxlength="100" list="admin-categories"')}</div><datalist id="admin-categories">${[...new Set(products.map(x=>x.category))].map(x=>`<option value="${escape(x)}"></option>`).join('')}</datalist>
  <div class="form-row">${field('price','Price (USD)',p.price,'number','required min="0.01" max="99999999.99" step="0.01"')}${field('stock','Stock quantity',p.stock,'number','required min="0" max="1000000" step="1"')}</div>
  ${field('sku','SKU',p.sku||'','text','required maxlength="100"')}
  <div class="field"><label for="admin-description">Description</label><textarea class="input" id="admin-description" name="description" required maxlength="5000">${escape(p.description||'')}</textarea></div>
  <div class="field"><label for="admin-photo">Upload product photo</label><input class="input" id="admin-photo" type="file" accept="image/jpeg,image/png,image/webp"><p class="admin-note muted">JPG, PNG or WebP. Maximum 5 MB. Photos are public product images.</p></div>
  ${field('image','Or use an HTTPS image URL',p.image?new URL(p.image,location.href).href:'','url','placeholder="https://…"')}
  <img class="admin-preview ${p.image?'':'hidden'}" id="admin-preview" alt="Product photo preview" ${p.image?`src="${escape(p.image)}"`:''}>
  <details><summary>More product details</summary>${field('badge','Badge (optional)',p.badge||'','text','maxlength="60" placeholder="New arrival"')}
  <div class="field"><label for="admin-features">Key features — one per line</label><textarea class="input" id="admin-features" name="features" maxlength="5000">${escape(lines(p.features))}</textarea></div>
  <div class="field"><label for="admin-specs">Specifications — one Key: Value per line</label><textarea class="input" id="admin-specs" name="specs" maxlength="5000" placeholder="Display: 6.1 inches&#10;Storage: 256 GB">${escape(Object.entries(p.specs||{}).map(([k,v])=>k+': '+v).join('\n'))}</textarea></div>
  <div class="field"><label for="admin-colors">Colours — one per line</label><textarea class="input" id="admin-colors" name="colors" maxlength="2000">${escape(lines(p.colors||['As pictured']))}</textarea></div>
  <div class="field"><label for="admin-gallery">Additional photo URLs — one HTTPS URL per line</label><textarea class="input" id="admin-gallery" name="gallery" maxlength="5000">${escape(lines(p.gallery))}</textarea></div></details>
  <label class="admin-check"><input name="active" type="checkbox" ${p.active?'checked':''}> Published in the store</label><p class="admin-note muted">Uncheck to hide this product. Existing orders keep their purchase details.</p>
  <div class="admin-actions"><button class="btn btn-primary" type="submit">${product?'Save changes':'Publish product'} ↗</button><button class="btn btn-outline" type="button" id="admin-clear">${product?'Cancel editing':'Clear form'}</button></div><div class="admin-message" role="status" id="product-message"></div></form>`;
  const form=document.getElementById('product-form'),preview=document.getElementById('admin-preview');let previewURL=null;
  document.getElementById('admin-photo').onchange=e=>{if(previewURL)URL.revokeObjectURL(previewURL);const file=e.target.files[0];if(file){previewURL=URL.createObjectURL(file);preview.src=previewURL;preview.classList.remove('hidden')}};
  document.getElementById('admin-image').onchange=e=>{if(!document.getElementById('admin-photo').files.length){try{const url=safeImage(e.target.value);preview.src=url;preview.classList.remove('hidden')}catch{preview.classList.add('hidden')}}};
  document.getElementById('admin-clear').onclick=()=>{if(previewURL)URL.revokeObjectURL(previewURL);editor()};
  form.onsubmit=async e=>{
   e.preventDefault();if(busy)return;busy=true;const message=document.getElementById('product-message');message.textContent='Saving product…';form.querySelectorAll('button').forEach(x=>x.disabled=true);
   try{
    const data=new FormData(form),text=k=>String(data.get(k)||'').trim(),split=k=>text(k).split('\n').map(x=>x.trim()).filter(Boolean);
    const price=Number(text('price')),stock=Number(text('stock'));if(!(price>0)||!Number.isInteger(stock)||stock<0)throw Error('Enter a valid price and whole-number stock quantity.');
    const specs=Object.fromEntries(split('specs').map(line=>{const i=line.indexOf(':');if(i<1)throw Error('Use Key: Value for each specification.');return [line.slice(0,i).trim(),line.slice(i+1).trim()]}));
    const payload={name:text('name'),brand:text('brand'),category:text('category'),price,stock,sku:text('sku'),description:text('description'),features:split('features'),specs,colors:split('colors'),badge:text('badge'),gallery:split('gallery').map(safeImage),active:data.has('active')};
    if(!payload.colors.length)payload.colors=['As pictured'];
    if(/[<>]/.test(JSON.stringify(payload)))throw Error('Use plain text without HTML markup in product details.');
    const file=document.getElementById('admin-photo').files[0];
    if(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880)throw Error('Choose a JPG, PNG or WebP photo under 5 MB.');}
    else payload.image=safeImage(text('image'));
    // Check server-side authorization again before sending an upload or product mutation.
    const {data:allowed,error:accessError}=await db.rpc('is_store_admin');if(accessError||!allowed)throw Error('Admin access is unavailable. Sign in with the approved verified account.');
    if(file){message.textContent='Uploading photo…';const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];const path=TNAuth.session.user.id+'/'+crypto.randomUUID()+'.'+ext;
     const {error}=await db.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});if(error)throw error;payload.image=db.storage.from('product-images').getPublicUrl(path).data.publicUrl;
     // Retain uploaded URL if saving fails, so retry does not upload another copy.
     document.getElementById('admin-image').value=payload.image;document.getElementById('admin-photo').value='';
    }
    message.textContent='Saving product…';
    let result;if(editing)result=await db.from('products').update(payload).eq('id',editing.id).select('id').single();else{payload.id=(payload.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'product')+'-'+crypto.randomUUID().slice(0,8);payload.arrival=Math.floor(Date.now()/1000);result=await db.from('products').insert(payload).select('id').single();}
    if(result.error)throw result.error;await loadProducts();await TNBackend.catalog();renderList();editor(products.find(x=>x.id===result.data.id));document.getElementById('product-message').textContent='Saved successfully. '+(payload.active?'This product is live in the store.':'This product is hidden from shoppers.');
   }catch(error){message.textContent=error.code==='23505'?'That SKU is already in use. Choose a unique SKU.':error.message||'Unable to save product.';}
   finally{busy=false;document.getElementById('product-form')?.querySelectorAll('button').forEach(x=>x.disabled=false)}
  };
 }
 function safeImage(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||/[<>"'\s]/.test(value))throw Error();return url.href}catch{throw Error('Add a product photo or a valid HTTPS image URL.')}}
 async function loadProducts(){const {data,error}=await db.from('products').select('*').order('created_at',{ascending:false});if(error)throw error;products=data;}
 function renderList(){
  const query=(document.getElementById('admin-search')?.value||'').trim().toLowerCase();const visible=products.filter(p=>[p.name,p.sku,p.category,p.brand].join(' ').toLowerCase().includes(query));
  document.getElementById('admin-summary').innerHTML=`<span><b>${products.length}</b> products</span><span><b>${products.filter(p=>p.active).length}</b> published</span><span><b>${products.filter(p=>p.stock===0).length}</b> out of stock</span>`;
  document.getElementById('admin-products').innerHTML=visible.length?visible.map(p=>`<div class="admin-product"><img src="${escape(p.image)}" alt="${escape(p.name)}"><div class="admin-product-info"><strong>${escape(p.name)}</strong><p class="muted">${escape(p.category)} · ${escape(p.sku)}</p><p>${TNU.money(p.price)} · ${p.stock} in stock · ${p.active?'Published':'Hidden'}</p></div><button class="btn btn-outline" data-edit="${escape(p.id)}">Edit</button></div>`).join(''):'<p class="muted">No matching products.</p>';
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{if(busy)return;editor(products.find(p=>p.id===b.dataset.edit));document.getElementById('admin-name').focus()});
 }
 async function render(){const version=++generation;
  if(!TNAuth.session){access('Sign in to manage the store','Use your approved, verified admin account to add products and manage the collection.',true);return;}
  status.textContent='Checking your access…';app.classList.add('hidden');
  try{const {data:allowed,error}=await db.rpc('is_store_admin');if(error)throw error;if(version!==generation)return;
   if(!allowed){access('Admin access required','This account can shop and save a profile. Product management is available only to the approved verified admin account.');return;}
   await loadProducts();if(version!==generation)return;status.textContent='';app.classList.remove('hidden');
   app.innerHTML=`<div class="admin-toolbar"><div><span class="eyebrow">YOUR COLLECTION</span><p class="muted">Signed in as ${escape(TNAuth.session.user.email)}</p><div id="admin-summary" class="admin-summary"></div></div><div class="admin-actions"><a class="btn btn-outline" href="shop.html">View store ↗</a><button id="admin-new" class="btn btn-primary">Add product +</button></div></div><div class="admin-layout"><section class="admin-list"><h2>The collection</h2><label for="admin-search" class="muted">Find a product</label><input class="input admin-search" id="admin-search" type="search" placeholder="Search name, category, brand or SKU"><div class="admin-list-scroll" id="admin-products"></div></section><section class="admin-editor" id="admin-editor"></section></div>`;
   renderList();editor();document.getElementById('admin-search').oninput=renderList;document.getElementById('admin-new').onclick=()=>{if(!busy){editor();document.getElementById('admin-name').focus()}};
  }catch(error){status.textContent='Unable to load product studio. '+error.message;}
 }
 document.addEventListener('tn:auth',render);await Promise.all([TNAuth.ready,TNBackend.ready]).catch(()=>{});await render();
});

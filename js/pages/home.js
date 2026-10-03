document.addEventListener('DOMContentLoaded',async()=>{
 await TNBackend.ready;
 const categoryOrder=['Phones','Laptops','Audio','Tablets','Wearables','Accessories','Gaming','Displays','Storage','Cameras'];
 const cats=categoryOrder.filter(c=>TN_CATEGORIES.includes(c));
 const imageIds={Phones:'iphone-13-pro',Laptops:'apple-macbook-pro-14-inch-space-grey',Audio:'apple-airpods-max-silver',Tablets:'samsung-galaxy-tab-s8-plus-grey',Wearables:'apple-watch-series-4-gold',Accessories:'logitech-mx-master-3s',Gaming:'sony-playstation-5',Cameras:'logitech-brio-500'};
 document.getElementById('catalog-size').textContent=TN_PRODUCTS.length+' products to explore';
 document.getElementById('category-grid').innerHTML=cats.map(c=>{const p=TNU.product(imageIds[c])||TN_PRODUCTS.find(p=>p.category===c);return `<a class="retail-category" href="shop.html?category=${encodeURIComponent(c)}"><div>${TNU.imgTag(p,'',c)}</div><strong>${c} <span>↗</span></strong><small>${TN_CATEGORY_COUNTS[c]} products</small></a>`}).join('');
 const picks=['apple-macbook-pro-14-inch-space-grey','iphone-13-pro','apple-airpods-max-silver','samsung-galaxy-tab-s8-plus-grey','new-dell-xps-13-9300-laptop','apple-watch-series-4-gold','samsung-galaxy-s10','apple-homepod-mini-cosmic-grey'];
 const tabs=document.getElementById('collection-tabs');let category='All picks';
 const show=()=>{const products=category==='All picks'?picks.map(TNU.product).filter(Boolean):TN_PRODUCTS.filter(p=>p.category===category);const grid=document.getElementById('featured-products');grid.innerHTML=products.slice(0,8).map(TNProductCard).join('');TNBindProductActions(grid);tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.category===category);b.setAttribute('aria-selected',b.dataset.category===category)})};
 tabs.innerHTML=['All picks','Phones','Laptops','Audio','Tablets','Accessories'].map((c,i)=>`<button role="tab" data-category="${c}" aria-selected="${i===0}">${c}</button>`).join('');tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{category=b.dataset.category;show()});show();
 const essentials=TN_PRODUCTS.filter(p=>p.category==='Accessories'||p.category==='Wearables');document.getElementById('new-products').innerHTML=essentials.slice(0,8).map(TNProductCard).join('');TNBindProductActions(document.getElementById('new-products'));
 document.getElementById('brand-cloud').innerHTML=[...new Set(TN_PRODUCTS.map(p=>p.brand))].filter(b=>b!=='TechNest').slice(0,8).map(b=>`<a href="shop.html?brand=${encodeURIComponent(b)}">${TNU.escape(b)}</a>`).join('');
 document.getElementById('home-newsletter-form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await TNBackend.request({action:'subscribe',email:document.getElementById('home-newsletter-email').value});e.target.reset();TNToast('You’re on the list')}catch(err){TNToast(err.message,'error')}finally{button.disabled=false}};
});

document.addEventListener('DOMContentLoaded',async()=>{
 await TNBackend.ready;
 const icons={Phones:'phone',Laptops:'laptop',Audio:'audio',Wearables:'watch',Tablets:'tablet',Accessories:'grid'};
 document.getElementById('category-grid').innerHTML=TN_CATEGORIES.map(c=>`<a class="category-card" href="shop.html?category=${c}"><span class="category-icon">${TNIcon(icons[c]||'grid',28)}</span><strong>${c}</strong><small>${TN_CATEGORY_COUNTS[c]} products</small></a>`).join('');
 const ids=['apple-macbook-pro-14-inch-space-grey','iphone-13-pro','apple-airpods-max-silver','samsung-galaxy-tab-s8-plus-grey'];
 const picks=ids.map(TNU.product).filter(Boolean);document.getElementById('featured-products').innerHTML=picks.map(TNProductCard).join('');TNBindProductActions(document.getElementById('featured-products'));
 document.getElementById('new-products').innerHTML=TN_PRODUCTS.filter(p=>p.category==='Accessories'||p.category==='Wearables').slice(0,4).map(TNProductCard).join('');TNBindProductActions(document.getElementById('new-products'));
 document.getElementById('brand-cloud').innerHTML=[...new Set(TN_PRODUCTS.map(p=>p.brand))].slice(0,6).map(b=>`<a href="shop.html?brand=${encodeURIComponent(b)}">${b}</a>`).join('');
 document.getElementById('home-newsletter-form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await TNBackend.request({action:'subscribe',email:document.getElementById('home-newsletter-email').value});e.target.reset();TNToast('Your email has been saved')}catch(err){TNToast(err.message,'error')}finally{button.disabled=false}};
});

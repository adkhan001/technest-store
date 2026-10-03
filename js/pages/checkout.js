document.addEventListener('DOMContentLoaded',async()=>{
 await TNBackend.ready;const items=TNStore.cartItems();if(!items.length){location.href='cart.html';return}
 const profile=TNStore.data.profile||{};['first','last','email','phone','address','city','state','zip'].forEach(k=>{if(profile[k])document.getElementById(k).value=profile[k]});
 const sub=items.reduce((s,i)=>s+TNU.product(i.id).price*i.qty,0);const coupon=sessionStorage.getItem('tn_coupon')==='TECH10';
 const summary=()=>{const express=document.querySelector('input[name=delivery]:checked').value==='express',discount=coupon?Math.round(sub*10)/100:0,ship=express?34.95:sub-discount>=250?0:19.95;document.getElementById('checkout-summary').innerHTML=`<h3>Your order</h3>${items.map(i=>{const p=TNU.product(i.id);return `<div class="summary-row"><span>${p.name} × ${i.qty}</span><b>${TNU.money(p.price*i.qty)}</b></div>`}).join('')}<div class="summary-row"><span>Subtotal</span><b>${TNU.money(sub)}</b></div>${discount?`<div class="summary-row"><span>TECH10 discount</span><b>−${TNU.money(discount)}</b></div>`:''}<div class="summary-row"><span>Delivery</span><b>${ship?TNU.money(ship):'Free'}</b></div><div class="summary-row total"><span>Total</span><b>${TNU.money(sub-discount+ship)}</b></div><p class="trust-note">No payment is collected. Your order is saved securely and can be tracked using its private tracking key.</p>`};summary();document.querySelectorAll('[name=delivery]').forEach(x=>x.onchange=summary);
 document.getElementById('checkout-form').onsubmit=async e=>{
  e.preventDefault();const button=e.target.querySelector('[type=submit]');if(button.disabled)return;button.disabled=true;button.textContent='Saving your order…';
  const data=Object.fromEntries(new FormData(e.target));
  const grouped={};items.forEach(i=>grouped[i.id]=(grouped[i.id]||0)+i.qty);
  try{const {order}=await TNBackend.request({action:'checkout',customer:data,items:Object.entries(grouped).map(([id,qty])=>({id,qty})),delivery:data.delivery,payment:'cod',coupon:coupon?'TECH10':''});TNStore.saveProfile(Object.fromEntries(['first','last','email','phone','address','city','state','zip'].map(k=>[k,data[k]])));TNStore.addOrder(order);sessionStorage.removeItem('tn_coupon');sessionStorage.setItem('tn_last_order',order.id);location.href='order-success.html?id='+order.id}
  catch(error){TNToast(error.message,'error');button.disabled=false;button.textContent='Place order'}
 };
});

document.addEventListener('DOMContentLoaded',()=>{
  const items=TNStore.cartItems();
  if(!items.length){location.href='cart.html';return}

  const profile=TNStore.data.profile||{};
  ['first','last','email','phone','address','city','state','zip'].forEach(k=>{
    const el=document.getElementById(k);
    if(el&&profile[k])el.value=profile[k];
  });

  const sub=items.reduce((sum,item)=>sum+TNU.product(item.id).price*item.qty,0);
  const coupon=sessionStorage.getItem('tn_coupon')==='TECH10';
  let currentTotal=0;

  function renderSummary(){
    const delivery=document.querySelector('input[name="delivery"]:checked')?.value||'standard';
    const discount=coupon?sub*.10:0;
    const ship=delivery==='express'?34.95:(sub-discount>=250?0:19.95);
    const tax=(sub-discount)*.07;
    currentTotal=sub-discount+ship+tax;
    document.getElementById('checkout-summary').innerHTML=`
      <h3>Your order</h3>
      ${items.map(item=>{const p=TNU.product(item.id);return `<div class="summary-row"><span>${p.name} x ${item.qty}</span><b>${TNU.money(p.price*item.qty)}</b></div>`}).join('')}
      ${discount?`<div class="summary-row"><span>TECH10 discount</span><b>-${TNU.money(discount)}</b></div>`:''}
      <div class="summary-row"><span>Delivery</span><b>${ship?TNU.money(ship):'Free'}</b></div>
      <div class="summary-row"><span>Tax</span><b>${TNU.money(tax)}</b></div>
      <div class="summary-row total"><span>Total</span><span>${TNU.money(currentTotal)}</span></div>`;
  }

  renderSummary();
  document.querySelectorAll('input[name="delivery"]').forEach(r=>r.addEventListener('change',renderSummary));

  document.getElementById('checkout-form').onsubmit=e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target));
    if(!data.first||!data.last||!data.email||!data.phone||!data.address||!data.city||!data.state||!data.zip){
      TNToast('Please complete all delivery fields','error');
      return;
    }
    TNStore.saveProfile(data);
    const order={
      id:TNU.id('TN'),
      date:new Date().toISOString(),
      status:'Order received',
      payment:data.payment||'cod',
      delivery:data.delivery||'standard',
      customer:data,
      items:items.map(i=>({...i})),
      total:currentTotal
    };
    TNStore.addOrder(order);
    sessionStorage.removeItem('tn_coupon');
    sessionStorage.setItem('tn_last_order',order.id);
    location.href='order-success.html?id='+order.id;
  };
});

window.TNStore={
 key:'technest_pro_v4',data:{cart:{},wishlist:[],compare:[],profile:null,orders:[],recent:[],theme:'light'},
 load(){try{const x=JSON.parse(localStorage.getItem(this.key));if(x)this.data={...this.data,...x}}catch(e){} return this.data},
 save(){localStorage.setItem(this.key,JSON.stringify(this.data));document.dispatchEvent(new CustomEvent('tn:state'))},
 addCart(id,qty=1,opts={}){const k=id+'|'+(opts.color||'Default')+'|'+(opts.storage||'Standard');const item=this.data.cart[k]||{id,qty:0,opts};item.qty=Math.min(TNU.product(id)?.stock||0,10,item.qty+qty);if(item.qty<=0)return;this.data.cart[k]=item;this.save()},
 setQty(key,qty){if(qty<=0)delete this.data.cart[key];else this.data.cart[key].qty=Math.min(qty,10,TNU.product(this.data.cart[key].id)?.stock||0);this.save()},removeCart(key){delete this.data.cart[key];this.save()},clearCart(){this.data.cart={};this.save()},
 cartCount(){return Object.values(this.data.cart).reduce((n,x)=>n+x.qty,0)},cartItems(){return Object.entries(this.data.cart).map(([key,v])=>({key,...v}))},
 toggleWish(id){const a=this.data.wishlist;this.data.wishlist=a.includes(id)?a.filter(x=>x!==id):[...a,id];this.save();return this.data.wishlist.includes(id)},
 toggleCompare(id){let a=this.data.compare;if(a.includes(id))a=a.filter(x=>x!==id);else if(a.length<4)a=[...a,id];this.data.compare=a;this.save();return a.includes(id)},
 addRecent(id){this.data.recent=[id,...this.data.recent.filter(x=>x!==id)].slice(0,8);this.save()},
 saveProfile(p){this.data.profile=p;this.save()},addOrder(o){this.data.orders=[o,...this.data.orders];this.clearCart()},setTheme(t){this.data.theme=t;this.save()}
};TNStore.load();

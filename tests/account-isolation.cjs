const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const entries = new Map();
const context = {
  document: { documentElement: { dataset: { theme: 'light' } }, dispatchEvent() {} },
  localStorage: { getItem:k=>entries.get(k)||null, setItem:(k,v)=>entries.set(k,v), removeItem:k=>entries.delete(k) },
  CustomEvent: class { constructor(type) { this.type=type; } }
};
context.window=context;
vm.runInNewContext(fs.readFileSync('js/core/store.js','utf8'),context);
const store=context.TNStore;
store.switchUser('customer-a');
store.data.cart={a:{id:'a',qty:1}};
store.data.profile={first:'Private A',address:'Private address'};
store.data.orders=[{id:'private-order',token:'private-tracking-key'}];
store.save();
const saved=JSON.parse(entries.get('technest_user_v5_customer-a'));
assert.equal(saved.profile,null);
assert.equal(saved.orders.length,0);
store.switchUser('customer-b');
assert.equal(Object.keys(store.data.cart).length,0);
assert.equal(store.data.profile,null);
assert.equal(store.data.orders.length,0);
store.data.cart={b:{id:'b',qty:2}};
store.save();
store.switchUser('customer-a');
assert.equal(store.data.cart.a.qty,1);
assert.equal(store.data.cart.b,undefined);
store.switchUser(null);
assert.equal(store.data.profile,null);
assert.equal(store.data.orders.length,0);
console.log('Account cache isolation and private-data clearing passed.');

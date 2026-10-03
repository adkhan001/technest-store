window.TNU={
 money:n=>'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),
 product:id=>TN_PRODUCTS.find(p=>p.id===id),
 img(p){return `${p.image}`},
 imgTag(p,cls='',alt=''){return `<img class="${cls}" src="${p.image}" alt="${alt||p.name}" loading="lazy" onerror="this.onerror=null;this.src='${p.fallback}'">`},
 params(){return Object.fromEntries(new URLSearchParams(location.search).entries())},
 query(k,v){const u=new URL(location.href); if(v===undefined||v===null||v==='')u.searchParams.delete(k);else u.searchParams.set(k,v);history.replaceState({},'',u)},
 stars(r){const full=Math.round(r);return `<span class="star">${'★'.repeat(Math.min(full,5))}${'☆'.repeat(Math.max(0,5-full))}</span>`},
 debounce(fn,ms=180){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}},
 id(prefix='TN'){return prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase()},
 dateLabel(d=new Date()){return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})},
 escape(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
};

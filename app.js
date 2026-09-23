const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
fetch('data/links.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{
 const s=d.site||{};
 for(const k of ['eyebrow','title','number','place','motto','mottoStrong']){const el=document.getElementById(k);if(el)el.textContent=s[k]||''}
 const logo=document.getElementById('siteLogo'); if(logo&&s.logoPath) logo.src=s.logoPath+'?v='+Date.now();
 const ft=document.getElementById('footerTitle'); if(ft)ft.textContent=s.footerTitle||'';
 const fm=document.getElementById('footerMotto'); if(fm)fm.textContent=s.footerMotto||'';
 const al=document.getElementById('adminLabel'); if(al)al.textContent=s.adminLabel||'Administração';
 const render=x=>{
   if(x.type==='divider'){
     const style=['line','title','fleur'].includes(x.style)?x.style:'title';
     return `<div class="content-divider ${style}" aria-hidden="true"><span>${style==='fleur'?'⚜':esc(x.title||'')}</span></div>`;
   }
   return `<a class="link ${x.featured?'featured':''}" href="${esc(x.url||'#')}"><span class="icon">${esc(x.icon||'🔗')}</span><span class="copy"><b>${esc(x.title)}</b><small>${esc(x.subtitle)}</small></span><span class="arrow">›</span></a>`;
 };
 document.getElementById('links').innerHTML=(d.links||[]).filter(x=>x.enabled).map(render).join('');
}).catch(()=>document.getElementById('links').innerHTML='<p style="color:white;text-align:center">Erro ao carregar links.</p>');

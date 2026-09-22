const KEY='agr676-cms-v131';let state,drag;const $=s=>document.querySelector(s),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);async function init(){try{state=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!state)state=await(await fetch('../data/links.json',{cache:'no-store'})).json();save(false);render()}function save(r=true){localStorage.setItem(KEY,JSON.stringify(state));if(r)render()}function render(){$('#count').textContent=`(${state.links.length})`;$('#list').innerHTML=state.links.map((x,i)=>`<div class="item ${x.enabled?'':'off'}" draggable="true" data-id="${x.id}"><span class="drag">≡</span><span class="ico">${x.icon||'🔗'}</span><span class="text"><b>${x.title}</b><small>${x.subtitle||x.url}</small><span class="tag">${x.enabled?'Publicado':'Oculto'}</span>${x.featured?'<span class="tag gold">Destacado</span>':''}</span><span class="ctrl"><button data-a="up">↑</button><button data-a="down">↓</button><button data-a="toggle">${x.enabled?'Ocultar':'Publicar'}</button><button data-a="edit">Editar</button><button data-a="delete" class="del">Apagar</button></span></div>`).join('');document.querySelectorAll('.item').forEach(el=>{el.ondragstart=()=>drag=el.dataset.id;el.ondragover=e=>e.preventDefault();el.ondrop=()=>{if(!drag||drag===el.dataset.id)return;let a=state.links.findIndex(x=>x.id===drag),b=state.links.findIndex(x=>x.id===el.dataset.id),m=state.links.splice(a,1)[0];state.links.splice(b,0,m);save()};el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(el.dataset.id,b.dataset.a))});preview()}function act(id,a){let i=state.links.findIndex(x=>x.id===id),x=state.links[i];if(a==='up'&&i>0)[state.links[i-1],state.links[i]]=[state.links[i],state.links[i-1]];if(a==='down'&&i<state.links.length-1)[state.links[i+1],state.links[i]]=[state.links[i],state.links[i+1]];if(a==='toggle')x.enabled=!x.enabled;if(a==='delete'){if(!confirm('Apagar este botão?'))return;state.links.splice(i,1)}if(a==='edit')return open(x);save()}function open(x={}){$('#id').value=x.id||'';$('#icon').value=x.icon||'🔗';$('#title').value=x.title||'';$('#subtitle').value=x.subtitle||'';$('#url').value=x.url||'';$('#enabled').checked=x.enabled??true;$('#featured').checked=x.featured??false;$('#dlgTitle').textContent=x.id?'Editar botão':'Novo botão';$('#dlg').showModal()}$('#new').onclick=()=>open();$('#cancel').onclick=()=>$('#dlg').close();$('#save').onclick=()=>{if(!$('#title').value.trim())return alert('Indica um título.');let id=$('#id').value||uid(),obj={id,icon:$('#icon').value||'🔗',title:$('#title').value.trim(),subtitle:$('#subtitle').value.trim(),url:$('#url').value.trim()||'#',enabled:$('#enabled').checked,featured:$('#featured').checked},old=state.links.find(x=>x.id===id);old?Object.assign(old,obj):state.links.push(obj);$('#dlg').close();save()};$('#export').onclick=()=>{let b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='links.json';a.click()};$('#import').onclick=()=>$('#file').click();$('#file').onchange=async e=>{try{let j=JSON.parse(await e.target.files[0].text());if(!Array.isArray(j.links))throw 0;state=j;save()}catch(e){alert('JSON inválido')}};function preview(){let d=JSON.stringify(state).replace(/</g,'\\u003c');$('#preview').srcdoc=`<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:28px 13px;background:linear-gradient(160deg,#214d3a,#0c2a20 72%);font-family:Arial;color:#17342a}.h{text-align:center;color:white}.l{width:75px;height:75px;margin:auto;border-radius:50%;background:#f5f0e5;display:grid;place-items:center;font-size:30px;color:#173d2d}.h h1{margin:10px}.h em{color:#e4b84f;font-style:normal}.h p{font-size:11px}.m{font-family:Georgia;font-style:italic;margin:18px!important}.m b{color:#f3ca68}.links{display:grid;gap:9px}.a{display:grid;grid-template-columns:38px 1fr 15px;align-items:center;background:white;border-radius:13px;padding:9px}.a.f{background:linear-gradient(135deg,#efc95e,#dca73d)}.i{width:34px;height:34px;display:grid;place-items:center;background:#173d2d12;border-radius:9px}.a b{font-size:12px}.a small{display:block;font-size:9px;color:#718079}</style><div id="x"></div><script>const d=${d};document.querySelector('#x').innerHTML='<div class="h"><div class="l">⚜</div><h1>'+d.site.title+' <em>'+d.site.number+'</em></h1><p>'+d.site.place+'</p><p class="m">'+d.site.motto+'<br><b>'+d.site.mottoStrong+'</b></p></div><div class="links">'+d.links.filter(x=>x.enabled).map(x=>'<div class="a '+(x.featured?'f':'')+'"><span class="i">'+x.icon+'</span><span><b>'+x.title+'</b><small>'+x.subtitle+'</small></span><span>›</span></div>').join('')+'</div>'<\/script>`}

const API='https://676-cms-api.adrvalente.workers.dev';

async function api(path,opt={}){
  const r=await fetch(API+path,{
    ...opt,
    credentials:'include',
    headers:{'Content-Type':'application/json',...(opt.headers||{})}
  });
  const body=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(body.error||body.message||`HTTP ${r.status}`);e.status=r.status;throw e}
  return body;
}

function showLogin(msg=''){
  document.querySelector('#authScreen').hidden=false;
  document.querySelector('#cmsApp').hidden=true;
  document.querySelector('#loginError').textContent=msg;
}
async function showCMS(session){
  document.querySelector('#authScreen').hidden=true;
  document.querySelector('#cmsApp').hidden=false;
  document.querySelector('#userLabel').textContent=`${session.user.username} · ${session.user.role}`;
  await init();
}
async function checkSession(){
  try{
    const s=await api('/api/auth/session',{method:'GET'});
    document.querySelector('#apiState').textContent='API online · sessão válida';
    await showCMS(s);
  }catch(e){
    document.querySelector('#apiState').textContent='API online · autenticação necessária';
    showLogin();
  }
}
document.querySelector('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=document.querySelector('#loginButton');
  const err=document.querySelector('#loginError');
  btn.disabled=true; btn.textContent='A entrar…'; err.textContent='';
  try{
    const out=await api('/api/auth/login',{
      method:'POST',
      body:JSON.stringify({
        username:document.querySelector('#loginUsername').value.trim(),
        password:document.querySelector('#loginPassword').value
      })
    });
    document.querySelector('#loginPassword').value='';
    await showCMS({user:out.user});
  }catch(ex){err.textContent=ex.status===401?'Utilizador ou password incorretos.':'Não foi possível iniciar sessão.'}
  finally{btn.disabled=false;btn.textContent='Entrar no CMS'}
});
document.querySelector('#logout').onclick=async()=>{
  try{await api('/api/auth/logout',{method:'POST',body:'{}'})}catch(e){}
  showLogin('Sessão terminada.');
};
document.querySelector('#publish').onclick=async()=>{
  const btn=document.querySelector('#publish');
  const saveState=document.querySelector('#saveState');

  if(!confirm('Publicar agora estas alterações no site do Agrupamento 676?'))return;

  const original=btn.textContent;
  btn.disabled=true;
  btn.textContent='⏳ A publicar…';
  saveState.textContent='A publicar no GitHub…';

  try{
    const out=await api('/api/publish',{
      method:'POST',
      body:JSON.stringify(state)
    });

    btn.textContent='✓ Publicado';
    saveState.textContent='Publicado com sucesso. O GitHub Pages será atualizado automaticamente.';

    setTimeout(()=>{
      btn.textContent=original;
      btn.disabled=false;
    },2500);

    if(out.commit?.sha){
      console.info('676 CMS commit:',out.commit.sha);
    }
  }catch(ex){
    btn.disabled=false;
    btn.textContent=original;

    if(ex.status===401){
      saveState.textContent='Sessão expirada. Inicia sessão novamente.';
      showLogin('A sessão expirou. Inicia sessão novamente.');
      return;
    }

    saveState.textContent='Erro ao publicar.';
    alert('Não foi possível publicar: '+ex.message);
  }
};
checkSession();

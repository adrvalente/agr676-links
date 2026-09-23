const KEY='agr676-cms-v1410';
let state,drag;
const $=s=>document.querySelector(s),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);

async function init(){
  try{state=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(!state)state=await(await fetch('../data/links.json',{cache:'no-store'})).json();
  state.links=(state.links||[]).map(x=>({...x,type:x.type||'link'}));
  save(false);render();
}
function save(r=true){localStorage.setItem(KEY,JSON.stringify(state));if(r)render()}
function isDivider(x){return x?.type==='divider'}
function render(){
  $('#count').textContent=`(${state.links.length})`;
  $('#list').innerHTML=state.links.map(x=>isDivider(x)?`
    <div class="item divider-item ${x.enabled?'':'off'}" draggable="true" data-id="${x.id}">
      <span class="drag">≡</span><span class="ico divider-ico">—</span>
      <span class="text"><b>${escapeHtml(x.title||'Divider')}</b><small>Separador · ${escapeHtml(dividerStyleLabel(x.style))}</small><span class="tag">${x.enabled?'Publicado':'Oculto'}</span></span>
      <span class="ctrl"><button data-a="up">↑</button><button data-a="down">↓</button><button data-a="toggle">${x.enabled?'Ocultar':'Publicar'}</button><button data-a="edit">Editar</button><button data-a="delete" class="del">Apagar</button></span>
    </div>`:`
    <div class="item ${x.enabled?'':'off'}" draggable="true" data-id="${x.id}">
      <span class="drag">≡</span><span class="ico">${escapeHtml(x.icon||'🔗')}</span>
      <span class="text"><b>${escapeHtml(x.title)}</b><small>${escapeHtml(x.subtitle||x.url)}</small><span class="tag">${x.enabled?'Publicado':'Oculto'}</span>${x.featured?'<span class="tag gold">Destacado</span>':''}</span>
      <span class="ctrl"><button data-a="up">↑</button><button data-a="down">↓</button><button data-a="toggle">${x.enabled?'Ocultar':'Publicar'}</button><button data-a="edit">Editar</button><button data-a="delete" class="del">Apagar</button></span>
    </div>`).join('');
  document.querySelectorAll('.item').forEach(el=>{
    el.ondragstart=()=>drag=el.dataset.id;el.ondragover=e=>e.preventDefault();el.ondrop=()=>{if(!drag||drag===el.dataset.id)return;let a=state.links.findIndex(x=>x.id===drag),b=state.links.findIndex(x=>x.id===el.dataset.id),m=state.links.splice(a,1)[0];state.links.splice(b,0,m);save()};
    el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(el.dataset.id,b.dataset.a));
  });
  preview();
}
function dividerStyleLabel(style){return style==='line'?'Linha':style==='fleur'?'Flor-de-lis':'Linha + título'}
function act(id,a){
  let i=state.links.findIndex(x=>x.id===id),x=state.links[i];
  if(a==='up'&&i>0)[state.links[i-1],state.links[i]]=[state.links[i],state.links[i-1]];
  if(a==='down'&&i<state.links.length-1)[state.links[i+1],state.links[i]]=[state.links[i],state.links[i+1]];
  if(a==='toggle')x.enabled=!x.enabled;
  if(a==='delete'){if(!confirm(isDivider(x)?'Apagar este divider?':'Apagar este botão?'))return;state.links.splice(i,1)}
  if(a==='edit')return isDivider(x)?openDivider(x):openLink(x);
  save();
}
function setDialogMode(mode){
  const divider=mode==='divider';
  $('#entryType').value=mode;
  $('#linkFields').hidden=divider;
  $('#dividerFields').hidden=!divider;
  $('#featuredWrap').hidden=divider;
  $('#dlgTitle').textContent=divider?'Novo divider':'Novo botão';
}
function openLink(x={}){
  setDialogMode('link');$('#id').value=x.id||'';$('#icon').value=x.icon||'🔗';$('#title').value=x.title||'';$('#subtitle').value=x.subtitle||'';$('#url').value=x.url||'';$('#enabled').checked=x.enabled??true;$('#featured').checked=x.featured??false;$('#dlgTitle').textContent=x.id?'Editar botão':'Novo botão';$('#dlg').showModal();
}
function openDivider(x={}){
  setDialogMode('divider');$('#id').value=x.id||'';$('#dividerTitle').value=x.title||'';$('#dividerStyle').value=x.style||'title';$('#enabled').checked=x.enabled??true;$('#dlgTitle').textContent=x.id?'Editar divider':'Novo divider';$('#dlg').showModal();
}
$('#new').onclick=()=>openLink();
$('#newDivider').onclick=()=>openDivider();
$('#cancel').onclick=()=>$('#dlg').close();
$('#save').onclick=()=>{
  const type=$('#entryType').value||'link',id=$('#id').value||uid();
  let obj;
  if(type==='divider'){
    obj={id,type:'divider',title:$('#dividerTitle').value.trim(),style:$('#dividerStyle').value||'title',enabled:$('#enabled').checked};
  }else{
    if(!$('#title').value.trim())return alert('Indica um título.');
    obj={id,type:'link',icon:$('#icon').value||'🔗',title:$('#title').value.trim(),subtitle:$('#subtitle').value.trim(),url:$('#url').value.trim()||'#',enabled:$('#enabled').checked,featured:$('#featured').checked};
  }
  const old=state.links.find(x=>x.id===id);old?Object.keys(old).forEach(k=>delete old[k]):null;old?Object.assign(old,obj):state.links.push(obj);$('#dlg').close();save();
};
$('#export').onclick=()=>{let b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='links.json';a.click()};
$('#import').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{try{let j=JSON.parse(await e.target.files[0].text());if(!Array.isArray(j.links))throw 0;j.links=j.links.map(x=>({...x,type:x.type||'link'}));state=j;save()}catch(e){alert('JSON inválido')}};
function preview(){
  let d=JSON.stringify(state).replace(/</g,'\\u003c');
  $('#preview').srcdoc=`<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;padding:28px 13px;background:linear-gradient(160deg,#214d3a,#0c2a20 72%);font-family:Arial;color:#17342a}.h{text-align:center;color:white}.l{width:75px;height:75px;margin:auto;border-radius:50%;background:#f5f0e5;display:grid;place-items:center;font-size:30px;color:#173d2d}.h h1{margin:10px}.h em{color:#e4b84f;font-style:normal}.h p{font-size:11px}.m{font-family:Georgia;font-style:italic;margin:18px!important}.m b{color:#f3ca68}.links{display:grid;gap:9px}.a{display:grid;grid-template-columns:38px 1fr 15px;align-items:center;background:white;border-radius:13px;padding:9px}.a.f{background:linear-gradient(135deg,#efc95e,#dca73d)}.i{width:34px;height:34px;display:grid;place-items:center;background:#173d2d12;border-radius:9px}.a b{font-size:12px}.a small{display:block;font-size:9px;color:#718079}.dv{display:flex;align-items:center;gap:8px;color:#f5e6b6;margin:8px 4px;font-size:9px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase}.dv:before,.dv:after{content:'';height:1px;background:#ffffff38;flex:1}.dv.line span{display:none}.dv.fleur span{font-size:14px}.dv.fleur span:before{content:'⚜';font-size:14px}.dv.fleur .t{display:none}</style><div id="x"></div><script>const d=${d};const item=x=>x.type==='divider'?'<div class="dv '+(x.style||'title')+'"><span class="t">'+(x.title||'')+'</span></div>':'<div class="a '+(x.featured?'f':'')+'"><span class="i">'+x.icon+'</span><span><b>'+x.title+'</b><small>'+x.subtitle+'</small></span><span>›</span></div>';document.querySelector('#x').innerHTML='<div class="h"><div class="l">⚜</div><h1>'+d.site.title+' <em>'+d.site.number+'</em></h1><p>'+d.site.place+'</p><p class="m">'+d.site.motto+'<br><b>'+d.site.mottoStrong+'</b></p></div><div class="links">'+d.links.filter(x=>x.enabled).map(item).join('')+'</div>'<\/script>`;
}

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
  applyRole(session);
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
      body:JSON.stringify({data:state,assets:pendingLogoAsset?{logo:{path:pendingLogoAsset.path,mime:pendingLogoAsset.mime,base64:pendingLogoAsset.base64}}:{}})
    });

    btn.textContent='✓ Publicado';
    saveState.textContent='Publicado com sucesso. O GitHub Pages será atualizado automaticamente.';
    document.querySelector('#publishState').textContent='🟢 Publicado';document.querySelector('#draftInfo').textContent='Sem alterações por publicar';document.querySelector('#lastPublish').textContent=new Date().toLocaleString('pt-PT');
    pendingLogoAsset=null;

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


// ===== V1.4.9.3 — User Management UI =====
let currentSession=null, publishedSnapshot=null;
let pendingLogoAsset=null;

function markDirty(){
  const el=document.querySelector('#publishState'), info=document.querySelector('#draftInfo');
  if(el){el.textContent='🟠 Alterações por publicar';el.classList.add('dirty')}
  if(info)info.textContent='Existem alterações guardadas localmente';
}
const originalSave=save;
save=function(r=true){ originalSave(r); if(r) markDirty(); };

document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',async()=>{
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.cms-view').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active'); document.querySelector('#'+btn.dataset.view)?.classList.add('active');
  if(btn.dataset.view==='usersView') await loadUsers();
  if(btn.dataset.view==='historyView') await loadHistory();
  if(btn.dataset.view==='siteView') renderSiteEditor();
}));

function applyRole(session){
  currentSession=session;
  const role=session?.user?.role||'editor';
  document.querySelector('#currentRole').textContent=role==='admin'?'Administrador':'Editor';
  document.querySelectorAll('.admin-only').forEach(el=>el.hidden=role!=='admin');
  const pub=document.querySelector('#publish');
  if(pub){pub.disabled=role!=='admin';pub.title=role==='admin'?'Publicar alterações':'Apenas administradores podem publicar';}
}

function renderSiteEditor(){
  const site=state?.site||{};
  const logoSrc=pendingLogoAsset?.preview || ('../'+(site.logoPath||'assets/logo-676.svg'));
  const fields=[
    ['eyebrow','Texto superior'],
    ['title','Nome'],
    ['number','Número'],
    ['place','Localização'],
    ['motto','Lema — linha 1'],
    ['mottoStrong','Lema — destaque'],
    ['footerTitle','Rodapé — título'],
    ['footerMotto','Rodapé — lema'],
    ['adminLabel','Texto do link de administração']
  ];
  document.querySelector('#siteEditor').innerHTML=`
    <div class="identity-card">
      <div>
        <h3>Identidade visual</h3>
        <p class="muted">Logótipo apresentado no cabeçalho e no ecrã de login.</p>
      </div>
      <div class="logo-editor">
        <div class="logo-preview"><img id="logoPreview" src="${logoSrc}" alt="Pré-visualização do logótipo"></div>
        <div class="logo-actions">
          <input id="logoFile" type="file" accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp" hidden>
          <button type="button" id="chooseLogo">Alterar logótipo</button>
          <button type="button" id="resetLogo">Repor logótipo atual</button>
          <small>SVG, PNG ou WebP · máximo 2 MB</small>
        </div>
      </div>
    </div>
    <h3>Conteúdo do cabeçalho e rodapé</h3>
    <div class="site-grid">${fields.map(([k,l])=>`<label>${l}<input data-site="${k}" value="${String(site[k]||'').replace(/"/g,'&quot;')}"></label>`).join('')}</div>`;

  document.querySelector('#chooseLogo').onclick=()=>document.querySelector('#logoFile').click();
  document.querySelector('#resetLogo').onclick=()=>{
    pendingLogoAsset=null;
    document.querySelector('#logoPreview').src='../'+(site.logoPath||'assets/logo-676.svg');
    markDirty();
  };
  document.querySelector('#logoFile').onchange=async e=>{
    const file=e.target.files?.[0]; if(!file)return;
    const allowed=['image/svg+xml','image/png','image/webp'];
    if(!allowed.includes(file.type)){alert('Formato não suportado. Usa SVG, PNG ou WebP.');return}
    if(file.size>2*1024*1024){alert('O logótipo não pode ultrapassar 2 MB.');return}
    const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
    const ext=file.type==='image/svg+xml'?'svg':file.type==='image/png'?'png':'webp';
    pendingLogoAsset={path:`assets/logo-676.${ext}`,mime:file.type,base64:String(dataUrl).split(',')[1],preview:dataUrl};
    state.site.logoPath=pendingLogoAsset.path;
    document.querySelector('#logoPreview').src=dataUrl;
    markDirty();
  };
}
document.querySelector('#saveSite')?.addEventListener('click',()=>{
  document.querySelectorAll('[data-site]').forEach(i=>{state.site[i.dataset.site]=i.value.trim()});
  save(); render(); alert('Conteúdo do site guardado localmente.');
});

function escapeHtml(value){
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

async function loadUsers(){
  const box=document.querySelector('#usersList');
  if(!box)return;

  try{
    const out=await api('/api/users',{method:'GET'});

    box.innerHTML=out.users.map(u=>{
      const name=u.name||u.username;
      const initial=name.charAt(0).toUpperCase();
      const isCurrentUser=u.username===currentSession?.user?.username;
      const roleLabel=u.role==='admin'?'Admin':'Editor';

      return `
        <div class="user-row">
          <div class="user-identity">
            <div class="user-avatar">${escapeHtml(initial)}</div>
            <div class="user-info">
              <strong>${escapeHtml(name)}</strong>
              <small>@${escapeHtml(u.username)}</small>
            </div>
          </div>

          <span class="role-badge">${roleLabel}</span>

          <span class="user-status ${u.active?'':'inactive'}">
            ${u.active?'Ativo':'Desativado'}
          </span>

          <div class="user-actions">
            ${!isCurrentUser && !u.legacy ? `
              <button data-password-user="${escapeHtml(u.username)}">Password</button>
              <button class="${u.active?'danger':''}" data-toggle-user="${escapeHtml(u.username)}" data-active="${u.active}">
                ${u.active?'Desativar':'Ativar'}
              </button>
            `:''}
          </div>
        </div>`;
    }).join('');

    box.querySelectorAll('[data-toggle-user]').forEach(button=>{
      button.onclick=async()=>{
        try{
          await api('/api/users/toggle',{
            method:'POST',
            body:JSON.stringify({
              username:button.dataset.toggleUser,
              active:button.dataset.active!=='true'
            })
          });
          await loadUsers();
        }catch(error){alert(error.message)}
      };
    });

    box.querySelectorAll('[data-password-user]').forEach(button=>{
      button.onclick=async()=>{
        const username=button.dataset.passwordUser;
        const password=prompt(`Nova password para ${username}:\n\nMínimo 10 caracteres.`);
        if(!password)return;
        if(password.length<10){alert('A password deve ter pelo menos 10 caracteres.');return}
        try{
          await api('/api/users/password',{
            method:'POST',
            body:JSON.stringify({username,password})
          });
          alert(`Password de ${username} alterada com sucesso.`);
        }catch(error){alert(error.message)}
      };
    });
  }catch(error){
    box.innerHTML=`<div class="user-load-error">Não foi possível carregar os utilizadores: ${escapeHtml(error.message)}</div>`;
  }
}

document.querySelector('#newUser')?.addEventListener('click',async()=>{
  const username=prompt('Username do novo editor:'); if(!username)return;
  const name=prompt('Nome do editor:')||username;
  const password=prompt('Password temporária (mínimo 10 caracteres):'); if(!password)return;
  try{await api('/api/users',{method:'POST',body:JSON.stringify({username,name,password,role:'editor'})});alert('Editor criado.');loadUsers()}catch(e){alert(e.message)}
});

async function loadHistory(){
  const box=document.querySelector('#historyList'); if(!box)return;
  try{
    const out=await api('/api/history',{method:'GET'});
    box.innerHTML=out.items.length?out.items.map(x=>`<div class="history-row"><div><b>${new Date(x.publishedAt).toLocaleString('pt-PT')}</b><small>${x.username||'—'} · ${x.message||'Publicação'}</small></div><code>${(x.commitSha||'').slice(0,8)}</code><button data-restore="${x.commitSha}">Repor</button></div>`).join(''):'Ainda não existem publicações registadas.';
    box.querySelectorAll('[data-restore]').forEach(b=>b.onclick=async()=>{if(!confirm('Repor esta versão publicada?'))return;try{await api('/api/restore',{method:'POST',body:JSON.stringify({commitSha:b.dataset.restore})});alert('Versão reposta e publicada.');location.reload()}catch(e){alert(e.message)}});
  }catch(e){box.textContent='Não foi possível carregar histórico: '+e.message}
}

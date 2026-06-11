/* ═══════════════════════════════════════
   SETTINGS
═══════════════════════════════════════ */
function renderSettings() {
  const s=settings;
  document.getElementById('s-br').value=s.boardingRate; document.getElementById('s-dc').value=s.daycareRate;
  document.getElementById('s-th').value=s.threshold; document.getElementById('s-pc').value=s.surchargePct;
  document.getElementById('s-bn').value=s.bizName||''; document.getElementById('s-bp').value=s.bizPhone||'';
  document.getElementById('s-be').value=s.bizEmail||''; document.getElementById('s-ba').value=s.bizAddr||'';
  document.getElementById('s-cap').value=s.capacity||12;
  const lp=document.getElementById('logo-preview'); if(lp) lp.src=pendingLogo||currentLogo();
  updateScPrev();
  // Team management — admin only
  const tc=document.getElementById('team-card');
  if(tc){ if(isAdmin()){ tc.style.display=''; renderTeamList(); tmRenderPerms(); tmRoleChange(); } else { tc.style.display='none'; } }
}

/* ── Team & access management (admin) ── */
let teamProfiles=[];
async function renderTeamList(){
  const el=document.getElementById('team-list'); if(!el) return;
  try{ teamProfiles=await dbGetProfiles(); }catch(e){ teamProfiles=[]; }
  if(!teamProfiles.length){ el.innerHTML='<div style="font-size:12px;color:var(--ink-faint);padding:4px 0 8px">No team members configured yet. Anyone who logs in without a profile is treated as admin (first-run). Add people below to assign roles.</div>'; return; }
  el.innerHTML='<div style="display:flex;flex-direction:column;gap:8px">'+teamProfiles.map(p=>{
    const roleColor={admin:'var(--coral)',staff:'var(--blue)',customer:'var(--forest)'}[p.role]||'var(--ink-light)';
    let detail='';
    if(p.role==='staff'){ const perms=p.permissions||{}; const on=SECTIONS.filter(s=>(s in perms)?perms[s]:(s!=='finance'&&s!=='settings')); detail='Can see: '+(on.length?on.join(', '):'nothing'); }
    else if(p.role==='customer'){ detail='Owner: '+(p.owner_name||'—'); }
    else detail='Full access';
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--cream-dark);border-radius:var(--r2);background:var(--cream-mid)">
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">${esc(p.email)} <span style="font-size:11px;font-weight:600;color:${roleColor};text-transform:capitalize">· ${esc(p.role)}</span></div><div style="font-size:11px;color:var(--ink-faint);margin-top:1px">${esc(detail)}</div></div>
      <button class="btn btn-o sm" onclick="tmEdit('${esc(p.email).replace(/'/g,"\\'")}')">Edit</button>
      <button class="btn btn-d sm" onclick="tmDelete('${esc(p.email).replace(/'/g,"\\'")}')">×</button>
    </div>`;
  }).join('')+'</div>';
}
function tmRoleChange(){
  const role=document.getElementById('tm-role').value;
  document.getElementById('tm-owner-wrap').style.display=role==='customer'?'':'none';
  document.getElementById('tm-perms-wrap').style.display=role==='staff'?'':'none';
}
function tmRenderPerms(sel){
  const labels={dashboard:'Dashboard',calc:'Calculator',calendar:'Calendar',requests:'Reservations',dogs:'Dogs',history:'History',finance:'Finance',settings:'Settings'};
  const perms=sel||{};
  document.getElementById('tm-perms').innerHTML=SECTIONS.map(s=>{
    const checked=(s in perms)?perms[s]:(s!=='finance'&&s!=='settings');
    return `<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-mid);cursor:pointer"><input type="checkbox" class="tm-perm" data-sec="${s}" ${checked?'checked':''} style="width:16px;height:16px;accent-color:var(--brown)">${labels[s]}</label>`;
  }).join('');
}
function tmEdit(email){
  const p=teamProfiles.find(x=>x.email.toLowerCase()===email.toLowerCase()); if(!p) return;
  document.getElementById('tm-email').value=p.email;
  document.getElementById('tm-role').value=p.role;
  document.getElementById('tm-owner').value=p.owner_name||'';
  tmRenderPerms(p.permissions||{});
  tmRoleChange();
  document.getElementById('tm-email').scrollIntoView({behavior:'smooth',block:'center'});
}
async function saveTeamMember(){
  const email=document.getElementById('tm-email').value.trim().toLowerCase();
  const role=document.getElementById('tm-role').value;
  const res=document.getElementById('tm-result');
  if(!email||!/.+@.+\..+/.test(email)){ res.style.display='block'; res.style.color='var(--danger)'; res.textContent='Enter a valid email.'; return; }
  const p={ email, role, owner_name:role==='customer'?document.getElementById('tm-owner').value.trim():null, permissions:{} };
  if(role==='staff'){ document.querySelectorAll('.tm-perm').forEach(cb=>{ p.permissions[cb.dataset.sec]=cb.checked; }); }
  if(role==='customer' && !p.owner_name){ res.style.display='block'; res.style.color='var(--danger)'; res.textContent='Customers need a linked owner name (must match their dogs).'; return; }
  setSyncState('busy');
  try{
    await dbUpsertProfile(p);
    setSyncState('ok');
    res.style.display='block'; res.style.color='var(--forest)'; res.textContent='✓ Saved '+email+'.';
    document.getElementById('tm-email').value=''; document.getElementById('tm-owner').value='';
    renderTeamList(); tmRenderPerms();
  }catch(e){ setSyncState('err'); res.style.display='block'; res.style.color='var(--danger)'; res.textContent='⚠️ '+e.message+' (is the profiles table created?)'; }
}
async function tmDelete(email){
  if(!confirm('Remove '+email+' from team config? (Their login still exists in Supabase; they\u2019d be treated as admin on next login.)')) return;
  setSyncState('busy');
  try{ await dbDeleteProfile(email); teamProfiles=teamProfiles.filter(p=>p.email.toLowerCase()!==email.toLowerCase()); setSyncState('ok'); renderTeamList(); toast('Removed.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message,true); }
}
let pendingLogo=null;
function handleLogoFile(input){
  const f=input.files[0]; if(!f) return;
  if(f.size>1024*1024){ toast('Logo must be under 1MB.', true); input.value=''; return; }
  const r=new FileReader();
  r.onload=e=>{ pendingLogo=e.target.result; const lp=document.getElementById('logo-preview'); if(lp) lp.src=pendingLogo; toast('Logo selected — click Save Settings to apply.'); };
  r.readAsDataURL(f);
}
function resetLogo(){ pendingLogo='__default__'; const lp=document.getElementById('logo-preview'); if(lp) lp.src=DEFAULT_LOGO; toast('Will reset to default logo on Save.'); }
function updateScPrev() {
  const t=parseFloat(document.getElementById('s-th').value)||3, p=parseFloat(document.getElementById('s-pc').value)||50, r=parseFloat(document.getElementById('s-br').value)||55;
  document.getElementById('sc-prev').innerHTML=`<strong>Rule:</strong> If check-out is more than <strong>${t} hour${t!==1?'s':''}</strong> past a full 24h period, a surcharge of <strong>${p}%</strong> ($${(r*p/100).toFixed(2)}) is added.`;
}
['s-th','s-pc','s-br'].forEach(id=>document.getElementById(id).addEventListener('input',updateScPrev));

async function saveSettings() {
  settings={
    boardingRate:parseFloat(document.getElementById('s-br').value)||DEF.boardingRate,
    daycareRate:parseFloat(document.getElementById('s-dc').value)||DEF.daycareRate,
    threshold:parseFloat(document.getElementById('s-th').value)||DEF.threshold,
    surchargePct:parseFloat(document.getElementById('s-pc').value)||DEF.surchargePct,
    bizName:document.getElementById('s-bn').value.trim()||DEF.bizName,
    bizPhone:document.getElementById('s-bp').value.trim(),
    bizEmail:document.getElementById('s-be').value.trim(),
    bizAddr:document.getElementById('s-ba').value.trim(),
    capacity:parseInt(document.getElementById('s-cap').value)||DEF.capacity,
    logo: pendingLogo==='__default__' ? null : (pendingLogo || settings.logo || null)
  };
  setSyncState('busy');
  try { await dbSaveSettings(settings); try{ if(settings.logo) localStorage.setItem('shvaan_logo', settings.logo); else localStorage.removeItem('shvaan_logo'); }catch(e){} pendingLogo=null; applyLogo(); setSyncState('ok'); toast('Settings saved!'); recalc(); }
  catch(e){ setSyncState('err'); toast('Error saving settings: '+e.message, true); }
}

async function resetSettings() {
  if(!confirm('Reset to defaults? (Logo will also reset)')) return;
  settings={...DEF};
  pendingLogo=null;
  setSyncState('busy');
  try { await dbSaveSettings(settings); applyLogo(); setSyncState('ok'); renderSettings(); toast('Reset to defaults.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}

/* ═══════════════════════════════════════
   UTILS
═══════════════════════════════════════ */
function esc(s){ if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

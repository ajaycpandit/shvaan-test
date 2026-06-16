/* ═══════════════════════════════════════
   SETTINGS
═══════════════════════════════════════ */
function renderSettings() {
  const s=settings;
  document.getElementById('s-br').value=s.boardingRate; document.getElementById('s-dc').value=s.daycareRate;
  document.getElementById('s-th').value=s.threshold;
  const spc=document.getElementById('s-pc'); if(spc) spc.value=s.surchargePct;
  document.getElementById('s-bn').value=s.bizName||''; document.getElementById('s-bp').value=s.bizPhone||'';
  document.getElementById('s-be').value=s.bizEmail||''; document.getElementById('s-ba').value=s.bizAddr||'';
  document.getElementById('s-cap').value=s.capacity||12;
  const lp=document.getElementById('logo-preview'); if(lp) lp.src=pendingLogo||currentLogo();
  updateScPrev();
  if(typeof renderRoleTemplates === 'function') renderRoleTemplates();
  if(typeof updateThemeSettingsRow === 'function') updateThemeSettingsRow();
  
  // Render surcharge settings directly
  setTimeout(() => {
    const surchargeDiv = document.getElementById('settings-surcharge');
    if(surchargeDiv){
      const sType = (settings && settings.surchargeType) ? settings.surchargeType : 'percent';
      const sPct = (settings && settings.surchargePct) ? settings.surchargePct : 25;
      const sAmt = (settings && settings.surchargeAmt) ? settings.surchargeAmt : 15;
      
      let html = '<div style="margin-top:12px;padding:12px;background:var(--cream-mid);border-radius:8px">';
      html += '<label style="display:block;margin-bottom:8px;font-size:13px;font-weight:600">Surcharge Type</label>';
      html += '<div style="display:flex;gap:10px;margin-bottom:12px">';
      html += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;flex:1">';
      html += '<input type="radio" name="surcharge-type" value="percent" ' + (sType==='percent'?'checked':'') + ' onchange="changeSurcharge(\'percent\')">';
      html += '<span>Percentage (%)</span>';
      html += '</label>';
      html += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;flex:1">';
      html += '<input type="radio" name="surcharge-type" value="fixed" ' + (sType==='fixed'?'checked':'') + ' onchange="changeSurcharge(\'fixed\')">';
      html += '<span>Fixed Amount ($)</span>';
      html += '</label>';
      html += '</div>';
      html += '<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">' + (sType==='percent'?'Surcharge %':'Surcharge Amount ($)') + '</label>';
      html += '<input type="number" id="surcharge-val" value="' + (sType==='percent'?sPct:sAmt) + '" ';
      html += (sType==='percent'?'step="1"':'step="0.01"') + ' min="0" ';
      html += 'style="width:100%;padding:8px;border:1px solid var(--cream-dark);border-radius:6px;font-family:inherit;font-size:14px" ';
      html += 'onchange="updateSurcharge(this.value)">';
      html += '<small style="display:block;margin-top:4px;color:var(--ink-faint);font-size:12px">' + (sType==='percent'?'% of daily rate':'$ per surcharge') + '</small>';
      html += '</div>';
      
      surchargeDiv.innerHTML = html;
    }
  }, 10);
  
  // Team management — admin only
  const tc=document.getElementById('team-card');
  if(tc){ if(isAdmin()){ tc.style.display=''; renderTeamList(); tmRenderPerms(); tmRoleChange(); } else { tc.style.display='none'; } }
  if(typeof renderTrendToggles==='function') renderTrendToggles();
}

// Dashboard trend enable/disable toggles
function renderTrendToggles(){
  const host=document.getElementById('settings-trends');
  if(!host || typeof TREND_CATALOG==='undefined') return;
  const enabled=(settings && settings.trendsEnabled) ? settings.trendsEnabled : {};
  host.innerHTML = TREND_CATALOG.map(function(t){
    const key=t[0], label=t[1], desc=t[2];
    const on = enabled[key] !== false;
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--cream-mid)">'
      + '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">'+esc(label)+'</div><div style="font-size:11px;color:var(--ink-faint)">'+esc(desc)+'</div></div>'
      + '<label class="switch" style="position:relative;display:inline-block;width:42px;height:24px;flex:none">'
      + '<input type="checkbox" '+(on?'checked':'')+' onchange="toggleTrend(\''+key+'\',this.checked)" style="opacity:0;width:0;height:0">'
      + '<span style="position:absolute;cursor:pointer;inset:0;background:'+(on?'var(--brown)':'var(--cream-dark)')+';border-radius:24px;transition:.2s"><span style="position:absolute;height:18px;width:18px;left:'+(on?'21px':'3px')+';top:3px;background:#fff;border-radius:50%;transition:.2s"></span></span>'
      + '</label></div>';
  }).join('');
}

async function toggleTrend(key, on){
  if(!settings.trendsEnabled) settings.trendsEnabled={};
  settings.trendsEnabled[key]=on;
  renderTrendToggles();
  setSyncState('busy');
  try{ await dbSaveSettings(settings); setSyncState('ok'); }
  catch(e){ setSyncState('err'); }
}

function changeSurcharge(type){
  if(settings){
    settings.surchargeType = type;
    dbSaveSettings(settings).catch(function(){});
    renderSettings();
  }
}

function updateSurcharge(val){
  if(settings){
    const num = parseFloat(val) || 0;
    const key = settings.surchargeType === 'percent' ? 'surchargePct' : 'surchargeAmt';
    settings[key] = num;
    dbSaveSettings(settings).catch(function(){});
  }
}

/* ── Role templates ───────────────────────────────────────── */
const ROLE_TEMPLATES = {
  senior_staff: {
    label: 'Senior Staff',
    desc: 'Full operational access except finance and settings',
    permissions: { dashboard:true, calc:true, calendar:true, requests:true, dogs:true, history:true, finance:false, settings:false }
  },
  junior_staff: {
    label: 'Junior Staff',
    desc: 'Day-to-day operations only — no history, finance or settings',
    permissions: { dashboard:true, calc:true, calendar:true, requests:true, dogs:true, history:false, finance:false, settings:false }
  },
  weekend_cover: {
    label: 'Weekend Cover',
    desc: 'Calendar and check-ins only',
    permissions: { dashboard:true, calc:false, calendar:true, requests:true, dogs:true, history:false, finance:false, settings:false }
  },
  finance_only: {
    label: 'Finance / Reporting',
    desc: 'Read-only finance and history access',
    permissions: { dashboard:true, calc:false, calendar:false, requests:false, dogs:false, history:true, finance:true, settings:false }
  }
};

function applyRoleTemplate(key) {
  const t = ROLE_TEMPLATES[key];
  if (!t) return;
  tmRenderPerms(t.permissions);
  document.getElementById('tm-role').value = 'staff';
  tmRoleChange();
  // highlight the active template
  document.querySelectorAll('.rt-btn').forEach(b => {
    b.style.borderColor = b.dataset.key === key ? 'var(--brown)' : 'var(--cream-dark)';
    b.style.background = b.dataset.key === key ? 'var(--forest-pale)' : 'var(--white)';
  });
  toast('Template applied — customise if needed, then save.');
}

function renderRoleTemplates() {
  const el = document.getElementById('role-templates');
  if (!el) return;
  el.innerHTML = Object.entries(ROLE_TEMPLATES).map(([key, t]) => `
    <button class="rt-btn" data-key="${key}" onclick="applyRoleTemplate('${key}')"
      style="text-align:left;border:1.5px solid var(--cream-dark);border-radius:var(--r2);padding:10px 12px;background:var(--white);cursor:pointer;font-family:'DM Sans',sans-serif;transition:border-color .15s,background .15s">
      <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:2px">${esc(t.label)}</div>
      <div style="font-size:11px;color:var(--ink-faint)">${esc(t.desc)}</div>
    </button>`).join('');
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
  const scp=document.getElementById('sc-prev'); if(!scp) return;
  const t=parseFloat((document.getElementById('s-th')||{}).value)||3;
  const r=parseFloat((document.getElementById('s-br')||{}).value)||55;
  const sType=(settings&&settings.surchargeType)?settings.surchargeType:'percent';
  if(sType==='fixed'){
    const amt=(settings&&settings.surchargeAmt)?settings.surchargeAmt:15;
    scp.innerHTML=`<strong>Rule:</strong> If check-out is more than <strong>${t} hour${t!==1?'s':''}</strong> past a full 24h period, a fixed surcharge of <strong>$${Number(amt).toFixed(2)}</strong> is added.`;
  } else {
    const p=(settings&&settings.surchargePct)?settings.surchargePct:25;
    scp.innerHTML=`<strong>Rule:</strong> If check-out is more than <strong>${t} hour${t!==1?'s':''}</strong> past a full 24h period, a surcharge of <strong>${p}%</strong> ($${(r*p/100).toFixed(2)}) is added.`;
  }
}
['s-th','s-pc','s-br'].forEach(id=>{const el=document.getElementById(id); if(el) el.addEventListener('input',updateScPrev);});

async function saveSettings() {
  settings={
    boardingRate:parseFloat(document.getElementById('s-br').value)||DEF.boardingRate,
    daycareRate:parseFloat(document.getElementById('s-dc').value)||DEF.daycareRate,
    threshold:parseFloat(document.getElementById('s-th').value)||DEF.threshold,
    surchargePct:parseFloat((document.getElementById('s-pc')||{}).value)||(settings&&settings.surchargePct)||DEF.surchargePct,
    surchargeType:(settings&&settings.surchargeType)||'percent',
    surchargeAmt:(settings&&settings.surchargeAmt)||DEF.surchargeAmt||15,
    bizName:document.getElementById('s-bn').value.trim()||DEF.bizName,
    bizPhone:document.getElementById('s-bp').value.trim(),
    bizEmail:document.getElementById('s-be').value.trim(),
    bizAddr:document.getElementById('s-ba').value.trim(),
    capacity:parseInt(document.getElementById('s-cap').value)||DEF.capacity,
    logo: pendingLogo==='__default__' ? null : (pendingLogo || settings.logo || null),
    theme: settings.theme || 'terracotta',
    trendsEnabled: settings.trendsEnabled || {}
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

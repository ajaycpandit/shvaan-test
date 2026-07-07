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
  if(typeof renderLateRules === 'function') renderLateRules();
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
  if(typeof renderReversalToggle==='function') renderReversalToggle();
  if(typeof renderAuditLog==='function') renderAuditLog();
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
  // Populate quick-pick (edit existing) dropdown
  const qp=document.getElementById('tm-quickpick');
  if(qp){
    qp.innerHTML='<option value="">✏️ Edit existing…</option>'+teamProfiles.map(p=>`<option value="${esc(p.email)}">${esc(p.email)} (${esc(p.role)})</option>`).join('');
  }
  // Populate owner-name dropdown from existing dogs (unique, sorted)
  const os=document.getElementById('tm-owner-select');
  if(os && typeof dogs!=='undefined'){
    const owners=[...new Set(dogs.map(d=>(d.owner_name||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    os.innerHTML='<option value="">— Pick from existing owners —</option>'+owners.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('');
  }
  // Count
  const cnt=document.getElementById('team-count');
  if(cnt) cnt.textContent = teamProfiles.length ? '('+teamProfiles.length+')' : '';

  if(!teamProfiles.length){ el.innerHTML='<div style="font-size:12px;color:var(--ink-faint);padding:4px 0 8px">No team members configured yet. Anyone who logs in without a profile is treated as admin (first-run). Add people below to assign roles.</div>'; return; }
  // Group by role so a large team stays organized, in a responsive grid
  const roleOrder=[['admin','Admins','var(--coral)'],['staff','Staff','var(--blue)'],['customer','Customers','var(--forest)']];
  const card=(p)=>{
    const roleColor={admin:'var(--coral)',staff:'var(--blue)',customer:'var(--forest)'}[p.role]||'var(--ink-light)';
    let detail='';
    if(p.role==='staff'){ const perms=p.permissions||{}; const on=SECTIONS.filter(s=>(s in perms)?perms[s]:(s!=='finance'&&s!=='settings')); detail='Can see: '+(on.length?on.join(', '):'nothing'); }
    else if(p.role==='customer'){ detail='Owner: '+(p.owner_name||'—'); }
    else detail='Full access';
    const hay=(p.email+' '+p.role+' '+(p.owner_name||'')).toLowerCase();
    return `<div class="team-row" data-search="${esc(hay)}" data-role="${p.role}" style="display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--cream-dark);border-radius:var(--r2);background:var(--cream-mid)">
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.email)}</div><div style="font-size:11px;color:var(--ink-faint);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(detail)}</div></div>
      <button class="btn btn-o sm" onclick="tmEdit('${esc(p.email).replace(/'/g,"\\'")}')">Edit</button>
      <button class="btn btn-d sm" onclick="tmDelete('${esc(p.email).replace(/'/g,"\\'")}')">×</button>
    </div>`;
  };
  let out='';
  roleOrder.forEach(function(grp){
    const members=teamProfiles.filter(p=>p.role===grp[0]);
    if(!members.length) return;
    out += '<div class="team-group" data-group="'+grp[0]+'" style="margin-bottom:12px">'
      + '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:'+grp[2]+';margin-bottom:6px">'+grp[1]+' ('+members.length+')</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px">'
      + members.map(card).join('')
      + '</div></div>';
  });
  el.innerHTML = out + '<div id="team-noresults" style="display:none;font-size:12px;color:var(--ink-faint);padding:8px 0">No matches.</div>';
}

function filterTeamList(){
  const q=(document.getElementById('team-search').value||'').toLowerCase().trim();
  const rows=document.querySelectorAll('.team-row');
  let shown=0;
  rows.forEach(r=>{ const match=!q||r.getAttribute('data-search').includes(q); r.style.display=match?'':'none'; if(match) shown++; });
  // Hide a role group if all its members are filtered out
  document.querySelectorAll('.team-group').forEach(g=>{
    const visible=g.querySelectorAll('.team-row:not([style*="display: none"])').length;
    g.style.display = visible? '' : 'none';
  });
  const nr=document.getElementById('team-noresults');
  if(nr) nr.style.display = (rows.length&&shown===0)?'block':'none';
}

function tmQuickPick(email){
  if(!email) return;
  tmEdit(email);
  const qp=document.getElementById('tm-quickpick'); if(qp) qp.value='';
}

function tmClearForm(){
  document.getElementById('tm-email').value='';
  document.getElementById('tm-email').removeAttribute('readonly');
  document.getElementById('tm-role').value='staff';
  document.getElementById('tm-owner').value='';
  const os=document.getElementById('tm-owner-select'); if(os) os.value='';
  const t=document.getElementById('tm-form-title'); if(t) t.textContent='Add a person';
  tmRenderPerms(); tmRoleChange();
  const res=document.getElementById('tm-result'); if(res) res.style.display='none';
}

function tmOwnerPick(name){
  if(name) document.getElementById('tm-owner').value=name;
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
  const os=document.getElementById('tm-owner-select'); if(os) os.value=p.owner_name||'';
  const t=document.getElementById('tm-form-title'); if(t) t.textContent='Editing '+p.email;
  tmRenderPerms(p.permissions||{});
  tmRoleChange();
  document.getElementById('tm-form-title').scrollIntoView({behavior:'smooth',block:'center'});
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
    const os=document.getElementById('tm-owner-select'); if(os) os.value='';
    const t=document.getElementById('tm-form-title'); if(t) t.textContent='Add a person';
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
    trendsEnabled: settings.trendsEnabled || {},
    reversalToolEnabled: settings.reversalToolEnabled || false,
    lateRules: settings.lateRules || [],
    fullDayHrs: (settings&&settings.fullDayHrs!=null)?settings.fullDayHrs:8
  };
  // Commit any edits made in the late-checkout rules manager.
  if(typeof lateRulesCommit === 'function') lateRulesCommit(settings);
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

// Collapsible settings accordion
function toggleAcc(id){
  const el = document.getElementById(id);
  if(el) el.classList.toggle('open');
}

/* ═══════════════════════════════════════
   ADVANCED: Reservation reversal tool (settings-gated, audited)
═══════════════════════════════════════ */
function renderReversalToggle(){
  const on = !!(settings && settings.reversalToolEnabled);
  const cb = document.getElementById('adv-reversal-toggle');
  const track = document.getElementById('adv-reversal-track');
  const knob = document.getElementById('adv-reversal-knob');
  const tool = document.getElementById('reversal-tool');
  if(cb) cb.checked = on;
  if(track) track.style.background = on ? 'var(--brown)' : 'var(--cream-dark)';
  if(knob) knob.style.left = on ? '21px' : '3px';
  if(tool){ tool.style.display = on ? 'block' : 'none'; if(on) renderReversalTool(); }
}

async function toggleReversalFeature(on){
  if(!settings) return;
  settings.reversalToolEnabled = on;
  renderReversalToggle();
  setSyncState('busy');
  try{ await dbSaveSettings(settings); setSyncState('ok'); }
  catch(e){ setSyncState('err'); }
}

function renderReversalTool(){
  const host = document.getElementById('reversal-tool');
  if(!host) return;
  const completed = (typeof requests!=='undefined'?requests:[]).filter(r=>r.status==='completed')
    .sort((a,b)=> new Date(b.actual_checkout||b.checkout) - new Date(a.actual_checkout||a.checkout));
  if(!completed.length){
    host.innerHTML = '<div style="font-size:12px;color:var(--ink-faint)">No completed reservations to reverse.</div>';
    return;
  }
  let html = '<div style="font-size:12px;font-weight:600;color:var(--ink-mid);margin-bottom:8px">Reverse completed reservations → confirmed</div>';
  html += '<div style="font-size:11px;color:var(--ink-faint);margin-bottom:10px;line-height:1.5">Select reservations to send back to “confirmed.” This deletes the generated invoice and clears check-in/out times. Every reversal is logged. This cannot be auto-redone.</div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn btn-o sm" style="font-size:11px" onclick="revSelectAll(true)">Select all</button><button class="btn btn-o sm" style="font-size:11px" onclick="revSelectAll(false)">Clear</button></div>';
  html += '<div style="max-height:260px;overflow-y:auto;border:1px solid var(--cream-dark);border-radius:var(--r2)">';
  completed.forEach(function(r){
    const co = new Date(r.actual_checkout||r.checkout);
    const coStr = isNaN(co)?'—':co.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const amt = (r.final_total!=null)?(' · $'+parseFloat(r.final_total).toFixed(2)):'';
    html += '<label style="display:flex;align-items:center;gap:10px;padding:9px 11px;border-bottom:1px solid var(--cream-mid);cursor:pointer">'
      + '<input type="checkbox" class="rev-cb" value="'+r.id+'" style="width:16px;height:16px;accent-color:var(--brown);flex:none">'
      + '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">'+esc(r.dog_name||'')+'</div>'
      + '<div style="font-size:11px;color:var(--ink-faint)">Checked out '+coStr+amt+'</div></div></label>';
  });
  html += '</div>';
  html += '<button class="btn btn-d" style="margin-top:12px" onclick="runReversal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>Reverse selected → Confirmed</button>';
  html += '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--cream-dark)"><div style="font-size:11px;font-weight:600;color:var(--ink-mid);margin-bottom:6px">Recent admin actions (reversals &amp; deletions)</div><div id="reversal-log" style="font-size:11px;color:var(--ink-faint)"></div></div>';
  host.innerHTML = html;
  renderReversalLog();
}

function revSelectAll(on){
  document.querySelectorAll('.rev-cb').forEach(function(cb){ cb.checked = on; });
}

function renderReversalLog(){
  const el = document.getElementById('reversal-log');
  if(!el) return;
  const logs = (typeof visitNotes!=='undefined'?visitNotes:[]).filter(function(n){ return n.note_type==='admin_action'; })
    .sort(function(a,b){ return new Date(b.created_at)-new Date(a.created_at); }).slice(0,10);
  if(!logs.length){ el.innerHTML='<span style="color:var(--ink-faint)">No reversals logged yet.</span>'; return; }
  el.innerHTML = logs.map(function(n){
    const when = new Date(n.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    return '<div style="padding:4px 0;border-bottom:1px solid var(--cream-mid)">'+esc(n.note||'')+' <span style="color:var(--ink-light)">· '+esc(n.created_by||'unknown')+' · '+when+'</span></div>';
  }).join('');
}

async function runReversal(){
  const ids = Array.from(document.querySelectorAll('.rev-cb')).filter(function(cb){return cb.checked;}).map(function(cb){return cb.value;});
  if(!ids.length){ toast('Select at least one reservation.', true); return; }
  if(!confirm('Reverse '+ids.length+' reservation'+(ids.length!==1?'s':'')+' back to “confirmed”?\n\nThis deletes their generated invoices and clears check-in/out times. Each action will be logged. This cannot be auto-redone.')) return;

  setSyncState('busy');
  let done=0, failed=0;
  for(const id of ids){
    const r = (typeof requests!=='undefined'?requests:[]).find(function(x){return x.id===id;});
    if(!r || r.status!=='completed'){ failed++; continue; }
    try{
      // delete generated invoice/booking
      if(r.booking_id){
        try{ await dbDeleteBooking(r.booking_id); }catch(_){}
        if(typeof bookings!=='undefined') bookings = bookings.filter(function(b){return b.id!==r.booking_id;});
      }
      const prevTotal = r.final_total;
      await dbUpdReq(r.id, {status:'confirmed', actual_checkin:null, actual_checkout:null, final_total:null, booking_id:null});
      r.status='confirmed'; r.actual_checkin=null; r.actual_checkout=null; r.final_total=null; r.booking_id=null;
      // audit log entry
      const logNote = {
        id: Date.now().toString()+Math.random().toString(36).slice(2),
        dog_id: r.dog_id||null, dog_name: r.dog_name||'',
        note_type: 'admin_action',
        note: 'Reversed completed → confirmed for '+(r.dog_name||'reservation')+(prevTotal!=null?' (invoice $'+parseFloat(prevTotal).toFixed(2)+' removed)':''),
        created_by: (typeof currentUser!=='undefined'&&currentUser)?currentUser.email:'unknown',
        created_at: new Date().toISOString()
      };
      try{ await dbAddNote(logNote); if(typeof visitNotes!=='undefined') visitNotes.unshift(logNote); }catch(_){}
      done++;
    }catch(e){ failed++; }
  }
  setSyncState(failed?'err':'ok');
  toast('✓ Reversed '+done+(failed?(' · '+failed+' failed'):'')+'.', failed>0);
  renderReversalTool();
  if(typeof updateBadges==='function') updateBadges();
  if(typeof renderRequests==='function') renderRequests();
  if(typeof renderDashboard==='function') renderDashboard();
}

/* ═══════════════════════════════════════
   Activity Log — dedicated, always-available, paginated
═══════════════════════════════════════ */
let auditLogPage = 0;
const AUDIT_PAGE_SIZE = 15;
function renderAuditLog(){
  const host = document.getElementById('audit-log-host');
  if(!host) return;
  const logs = (typeof visitNotes!=='undefined'?visitNotes:[])
    .filter(function(n){ return n.note_type==='admin_action'; })
    .sort(function(a,b){ return new Date(b.created_at)-new Date(a.created_at); });
  if(!logs.length){ host.innerHTML='<div style="font-size:12px;color:var(--ink-faint)">No activity recorded yet.</div>'; return; }

  const pages = Math.ceil(logs.length / AUDIT_PAGE_SIZE);
  if(auditLogPage >= pages) auditLogPage = pages-1;
  if(auditLogPage < 0) auditLogPage = 0;
  const start = auditLogPage * AUDIT_PAGE_SIZE;
  const slice = logs.slice(start, start + AUDIT_PAGE_SIZE);

  let html = '<div style="border:1px solid var(--cream-dark);border-radius:var(--r2);overflow:hidden">';
  html += slice.map(function(n){
    const when = new Date(n.created_at).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
    const who = esc(n.created_by||'unknown');
    return '<div style="padding:9px 11px;border-bottom:1px solid var(--cream-mid);font-size:12px">'
      + '<div style="color:var(--ink)">'+esc(n.note||'')+'</div>'
      + '<div style="font-size:11px;color:var(--ink-faint);margin-top:2px">'+who+' · '+when+'</div></div>';
  }).join('');
  html += '</div>';
  if(pages > 1){
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:12px">'
      + '<button class="btn btn-o sm" style="font-size:11px" '+(auditLogPage<=0?'disabled':'')+' onclick="auditLogPrev()">‹ Newer</button>'
      + '<span style="color:var(--ink-faint)">Page '+(auditLogPage+1)+' of '+pages+' · '+logs.length+' entries</span>'
      + '<button class="btn btn-o sm" style="font-size:11px" '+(auditLogPage>=pages-1?'disabled':'')+' onclick="auditLogNext()">Older ›</button>'
      + '</div>';
  }
  host.innerHTML = html;
}
function auditLogPrev(){ if(auditLogPage>0){ auditLogPage--; renderAuditLog(); } }
function auditLogNext(){ auditLogPage++; renderAuditLog(); }

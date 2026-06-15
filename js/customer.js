/* ═══════════════════════════════════════
   CUSTOMER VIEW
   Shown when the logged-in user's role is 'customer'.
   Scoped to their own data via profile.owner_name.
═══════════════════════════════════════ */
let custTab='dogs';
let custDogs=[], custBookings=[], custReqs=[];

async function initCustomer(){
  const appShell=document.getElementById('app-shell'); if(appShell) appShell.style.display='none';
  const cs=document.getElementById('customer-shell'); if(cs) cs.style.display='';
  applyLogo();
  document.getElementById('loading').style.opacity='0';
  setTimeout(()=>{ document.getElementById('loading').style.display='none'; },400);
  try{
    await loadCustomerData();
    renderCustomerShell();
    custGo('dogs');
  }catch(e){
    const el=document.getElementById('cust-body');
    if(el) el.innerHTML='<div class="es"><span class="ei">⚠️</span><p>Could not load your account: '+esc(e.message)+'</p></div>';
  }
}

async function loadCustomerData(){
  const owner=(myProfile&&myProfile.owner_name)||'';
  // Load global settings (for rates/invoice branding) + this owner's dogs, bookings, requests.
  const s=await dbGetSettings(); if(s) settings={...DEF,...s};
  try{ if(settings.logo) localStorage.setItem('shvaan_logo', settings.logo); }catch(e){}
  const allDogs=await dbGetDogs();
  custDogs=(allDogs||[]).filter(d=>(d.owner_name||'').toLowerCase()===owner.toLowerCase());
  dogs=allDogs||[]; // needed by buildInv etc.
  const allBookings=await dbGetBookings();
  custBookings=(allBookings||[]).filter(b=>(b.entries||[]).some(e=>(e.ownerName||'').toLowerCase()===owner.toLowerCase()));
  bookings=allBookings||[];
  custReqs=(await dbGetReqs()||[]).filter(r=>(r.owner_name||'').toLowerCase()===owner.toLowerCase());
}

function renderCustomerShell(){
  const body=document.getElementById('cust-body');
  const owner=(myProfile&&myProfile.owner_name)||'there';
  body.innerHTML=`
    <div style="margin-bottom:18px">
      <div style="font-family:'DM Serif Display',serif;font-size:24px;color:var(--ink)">Welcome, ${esc(owner)}! 🐾</div>
      <div style="font-size:13px;color:var(--ink-light);margin-top:2px">Manage your dogs, reservations, and invoices.</div>
    </div>
    <div style="display:flex;gap:0;background:var(--cream-mid);border:1.5px solid var(--cream-dark);border-radius:var(--r3);padding:4px;margin-bottom:18px;width:fit-content;flex-wrap:wrap">
      <button class="svc-btn" id="custtab-dogs" onclick="custGo('dogs')" style="flex:none;padding:8px 16px">🐶 My Dogs</button>
      <button class="svc-btn" id="custtab-book" onclick="custGo('book')" style="flex:none;padding:8px 16px">📅 Request Booking</button>
      <button class="svc-btn" id="custtab-history" onclick="custGo('history')" style="flex:none;padding:8px 16px">🧾 My History</button>
    </div>
    <div id="cust-tab-body"></div>`;
}

function custGo(tab){
  custTab=tab;
  ['dogs','book','history'].forEach(t=>{ const b=document.getElementById('custtab-'+t); if(b) b.classList.toggle('active',t===tab); });
  if(tab==='dogs') renderCustDogs();
  if(tab==='book') renderCustBook();
  if(tab==='history') renderCustHistory();
}

/* ── My Dogs ── */
function renderCustDogs(){
  const c=document.getElementById('cust-tab-body');
  if(!custDogs.length){ c.innerHTML='<div class="card"><div class="es"><span class="ei">🐕</span><p>No dogs on file yet. Contact us to add your dog\u2019s profile.</p></div></div>'; return; }
  c.innerHTML='<div style="display:flex;flex-direction:column;gap:12px">'+custDogs.map(d=>{
    const rv=vaccStatus(d.vacc_rabies), dv=vaccStatus(d.vacc_dhpp), bv=vaccStatus(d.vacc_bordetella);
    return `<div class="card" style="margin:0">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">
        <div class="da" style="width:54px;height:54px;font-size:24px">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div>
        <div><div style="font-size:17px;font-weight:600;color:var(--ink)">${esc(d.dog_name)}</div><div style="font-size:13px;color:var(--ink-light)">${d.breed?esc(d.breed):'Dog'}</div></div>
      </div>
      <div class="vacc-row">
        <span class="vbdg ${rv.cls}">💉 Rabies: ${rv.label}</span>
        <span class="vbdg ${dv.cls}">💉 DHPP: ${dv.label}</span>
        <span class="vbdg ${bv.cls}">💉 Bordetella: ${bv.label}</span>
      </div>
      ${d.notes?`<div style="font-size:12px;color:var(--ink-light);margin-top:8px">📋 ${esc(d.notes)}</div>`:''}
    </div>`;
  }).join('')+'</div>';
}

/* ── Request Booking ── */
let custBookDogs=new Set();
function renderCustBook(){
  const c=document.getElementById('cust-tab-body');
  if(!custDogs.length){ c.innerHTML='<div class="card"><div class="es"><span class="ei">🐕</span><p>We need your dog\u2019s profile on file before booking. Please contact us.</p></div></div>'; return; }
  custBookDogs=new Set();
  const today=new Date().toISOString().split('T')[0];
  c.innerHTML=`<div class="card" style="margin:0">
    <div class="ct">📅 Request a Stay</div>
    <div style="font-size:12px;color:var(--ink-faint);margin-bottom:14px">Choose your dog(s), service, and dates. We\u2019ll confirm availability and contact you.</div>
    <div class="fd" style="margin-bottom:12px"><label>Service</label>
      <select id="cb-svc"><option value="boarding">🏡 Boarding</option><option value="daycare">☀️ Day Care</option></select>
    </div>
    <div class="fd" style="margin-bottom:12px"><label>Your Dog(s)</label>
      <div id="cb-dogs" style="display:flex;flex-wrap:wrap;gap:8px">${custDogs.map(d=>`<button type="button" class="btn btn-o sm" id="cb-dog-${d.id}" onclick="custToggleDog('${d.id}')">${d.photo?'🐶':'🐶'} ${esc(d.dog_name)}</button>`).join('')}</div>
    </div>
    <div class="g2" style="margin-bottom:12px">
      <div class="fd"><label>Check-In Date</label><input type="date" id="cb-ci" value="${today}"></div>
      <div class="fd"><label>Check-In Time</label><input type="time" id="cb-ci-t" value="10:00"></div>
      <div class="fd"><label>Check-Out Date</label><input type="date" id="cb-co" value="${today}"></div>
      <div class="fd"><label>Check-Out Time</label><input type="time" id="cb-co-t" value="10:00"></div>
    </div>
    <div class="fd" style="margin-bottom:14px"><label>Notes / Special Instructions</label><textarea id="cb-notes" style="height:60px" placeholder="Feeding schedule, medications, anything we should know…"></textarea></div>
    <div id="cb-result" style="font-size:13px;margin-bottom:10px;display:none"></div>
    <button class="btn btn-p" id="cb-submit" onclick="custSubmitBooking()" style="width:100%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>Submit Request</button>
  </div>`;
}
function custToggleDog(id){
  if(custBookDogs.has(id)) custBookDogs.delete(id); else custBookDogs.add(id);
  const b=document.getElementById('cb-dog-'+id);
  if(b){ const on=custBookDogs.has(id); b.classList.toggle('btn-p',on); b.classList.toggle('btn-o',!on); }
}
async function custSubmitBooking(){
  const res=document.getElementById('cb-result');
  if(!custBookDogs.size){ res.style.display='block'; res.style.color='var(--danger)'; res.textContent='Please select at least one dog.'; return; }
  const ci=document.getElementById('cb-ci').value, cit=document.getElementById('cb-ci-t').value;
  const co=document.getElementById('cb-co').value, cot=document.getElementById('cb-co-t').value;
  if(!ci||!co){ res.style.display='block'; res.style.color='var(--danger)'; res.textContent='Please choose check-in and check-out dates.'; return; }
  const inDt=new Date(ci+'T'+cit), outDt=new Date(co+'T'+cot);
  if(outDt<=inDt){ res.style.display='block'; res.style.color='var(--danger)'; res.textContent='Check-out must be after check-in.'; return; }
  const sel=custDogs.filter(d=>custBookDogs.has(d.id));
  const owner=(myProfile&&myProfile.owner_name)||'';
  const btn=document.getElementById('cb-submit'); btn.disabled=true; btn.style.opacity='.7';
  const rec={ id:Date.now().toString()+Math.random().toString(36).slice(2), dog_id:sel[0].id, dog_ids:sel.map(d=>d.id), dog_name:sel.map(d=>d.dog_name).join(', '), owner_name:owner, service:document.getElementById('cb-svc').value, checkin:ci+'T'+cit, checkout:co+'T'+cot, notes:document.getElementById('cb-notes').value.trim(), status:'pending', created_at:new Date().toISOString(), source:'customer' };
  try{
    await sbFetch('requests','POST',rec);
    custReqs.unshift(rec);
    res.style.display='block'; res.style.color='var(--forest)'; res.innerHTML='✅ Request submitted! We\u2019ll confirm and reach out soon.';
    btn.disabled=false; btn.style.opacity='1';
    setTimeout(()=>custGo('history'),1200);
  }catch(e){ res.style.display='block'; res.style.color='var(--danger)'; res.textContent='⚠️ '+e.message; btn.disabled=false; btn.style.opacity='1'; }
}

/* ── My History (reservations + completed bookings/invoices) ── */
function renderCustHistory(){
  const c=document.getElementById('cust-tab-body');
  const fd=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const ft=s=>new Date(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  let html='';
  // Active/upcoming reservations
  const active=custReqs.filter(r=>r.status!=='completed'&&r.status!=='declined');
  html+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);margin-bottom:8px">Upcoming & Pending</div>';
  if(active.length){
    html+='<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">'+active.map(r=>{
      const stLabel={pending:'Pending confirmation',confirmed:'Confirmed',checked_in:'Checked in'}[r.status]||r.status;
      const stColor={pending:'var(--gold)',confirmed:'var(--forest)',checked_in:'var(--blue)'}[r.status]||'var(--ink-light)';
      return `<div class="card" style="margin:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div style="font-size:15px;font-weight:600;color:var(--ink)">${esc(r.dog_name)}</div><div style="font-size:12px;color:var(--ink-faint);margin-top:2px">${r.service==='boarding'?'🏡 Boarding':'☀️ Day Care'}</div></div>
          <span style="font-size:11px;font-weight:600;color:${stColor}">${stLabel}</span>
        </div>
        <div style="font-size:12px;color:var(--ink-light);margin-top:8px">${fd(r.checkin)} ${ft(r.checkin)} → ${fd(r.checkout)} ${ft(r.checkout)}</div>
      </div>`;
    }).join('')+'</div>';
  } else { html+='<div style="font-size:13px;color:var(--ink-faint);margin-bottom:20px">No upcoming reservations. Use “Request Booking” to make one.</div>'; }
  // Completed bookings with invoices
  html+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);margin-bottom:8px">Past Stays & Invoices</div>';
  const past=[...custBookings].sort((a,b)=>new Date(b.checkout||b.saved_at)-new Date(a.checkout||a.saved_at));
  if(past.length){
    html+='<div style="display:flex;flex-direction:column;gap:10px">'+past.map(b=>`
      <div class="card" style="margin:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div><div style="font-size:15px;font-weight:600;color:var(--ink)">${esc((b.entries||[]).map(e=>e.dogName||'').join(', '))}</div><div style="font-size:12px;color:var(--ink-faint);margin-top:2px">${fd(b.checkin)} → ${fd(b.checkout)}</div></div>
          <div style="text-align:right"><div style="font-family:'DM Serif Display',serif;font-size:18px;color:var(--ink)">$${parseFloat(b.grand_total).toFixed(2)}</div>${b.paid?'<div style="font-size:10px;color:var(--forest);font-weight:600">✓ Paid</div>':'<div style="font-size:10px;color:var(--danger);font-weight:600">● Unpaid</div>'}</div>
        </div>
        <button class="btn btn-g sm" style="margin-top:10px" onclick="openInv('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>View Invoice</button>
      </div>`).join('')+'</div>';
  } else { html+='<div style="font-size:13px;color:var(--ink-faint)">No past stays yet.</div>'; }
  c.innerHTML=html;
}

/* ═══════════════════════════════════════
   REQUESTS
═══════════════════════════════════════ */
function renderReqDD(){
  const btn=document.getElementById('req-dd-btn');
  if(!btn) return;
  if(!dogs.length){ btn.querySelector('span').textContent='No dogs yet'; return; }
  renderReqDDList(); renderReqSel();
}
function renderReqDDList(){
  const list=document.getElementById('req-dd-list'); if(!list) return;
  const q=(document.getElementById('req-dd-search')?.value||'').toLowerCase().trim();
  const filtered=dogs.filter(d=>!q||(d.dog_name||'').toLowerCase().includes(q)||(d.owner_name||'').toLowerCase().includes(q));
  if(!filtered.length){ list.innerHTML='<div style="padding:14px;text-align:center;font-size:13px;color:var(--ink-faint)">No dogs match "'+esc(q)+'"</div>'; return; }
  list.innerHTML=filtered.map(d=>`<div class="dd-item${reqSelDogs.has(d.id)?' sel':''}" onclick="toggleReqDog('${d.id}')"><div class="dd-ava">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div><div style="flex:1;min-width:0"><div class="dd-name">${esc(d.dog_name)}</div><div class="dd-sub">${esc(d.owner_name)}</div></div><div class="dd-chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div></div>`).join('');
}
function toggleReqDD(){ reqDdOpen=!reqDdOpen; document.getElementById('req-dd-menu').style.display=reqDdOpen?'block':'none'; document.getElementById('req-dd-btn').classList.toggle('open',reqDdOpen); if(reqDdOpen){ const s=document.getElementById('req-dd-search'); if(s){ s.value=''; renderReqDDList(); setTimeout(()=>s.focus(),50); } } }
function closeReqDD(){ reqDdOpen=false; const m=document.getElementById('req-dd-menu'); if(m) m.style.display='none'; const b=document.getElementById('req-dd-btn'); if(b) b.classList.remove('open'); }
function toggleReqDog(id){
  if(reqSelDogs.has(id)) reqSelDogs.delete(id); else reqSelDogs.add(id);
  renderReqDDList(); renderReqSel();
}
function renderReqSel(){
  const cnt=reqSelDogs.size, lbl=document.getElementById('req-dd-lbl');
  lbl.textContent=cnt?cnt+' dog'+(cnt>1?'s':'')+' selected':'Select dog(s)…';
  lbl.style.color=cnt?'var(--ink)':'var(--ink-faint)';
  const tags=document.getElementById('req-sel-tags');
  tags.innerHTML=[...reqSelDogs].map(id=>{const d=dogs.find(x=>x.id===id);if(!d)return'';return `<span class="sel-tag"><span class="sel-tag-ava">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</span>${esc(d.dog_name)}<span class="sel-tag-x" onclick="toggleReqDog('${d.id}')">×</span></span>`;}).join('');
  // recall card: show for the selected dogs (each)
  const rc=document.getElementById('req-recall');
  if(cnt){ rc.innerHTML=[...reqSelDogs].map(id=>recallCard(id)).join('<div style="height:8px"></div>'); rc.style.display=''; } else rc.style.display='none';
}
/* "Things to know" recall card — surfaces traits + flagged + recent notes */
function recallCard(dogId){
  const d=dogs.find(x=>x.id===dogId); if(!d) return '';
  const notes=visitNotes.filter(n=>n.dog_id===dogId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const flagged=notes.filter(n=>n.flagged);
  const recent=notes.slice(0,3);
  const t=d.traits||{};
  const hasTraits=t.temperament||t.social||t.energy||t.play||t.eating||t.handling;
  if(!hasTraits && !notes.length) return `<div style="background:var(--cream-mid);border:1px solid var(--cream-dark);border-radius:var(--radius-md);padding:11px 13px;font-size:12px;color:var(--ink-faint)">🆕 ${esc(d.dog_name)} — first-time guest, no history yet.</div>`;
  const fd=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  let html=`<div style="background:var(--coral-pale);border:1px solid #F0C9BE;border-radius:var(--radius-md);padding:12px 14px">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--coral);margin-bottom:8px">💡 Things to know about ${esc(d.dog_name)}</div>`;
  if(hasTraits) html+=traitChips(d,true);
  const show=[...flagged, ...recent.filter(n=>!n.flagged)].slice(0,4);
  if(show.length){
    html+='<div style="margin-top:9px;display:flex;flex-direction:column;gap:5px">'+show.map(n=>`<div style="font-size:12px;color:var(--ink);line-height:1.4">${n.flagged?'⚠️ ':'• '}<strong>${esc(n.category)}:</strong> ${esc(n.note)} <span style="color:var(--ink-faint)">(${fd(n.created_at)})</span></div>`).join('')+'</div>';
  }
  html+=`<div style="margin-top:9px"><a onclick="openDogHistory('${dogId}')" style="cursor:pointer;font-size:12px;font-weight:600;color:var(--brown)">View full history →</a></div></div>`;
  return html;
}
document.addEventListener('click', e=>{ if(!e.target.closest('#req-dd-btn')&&!e.target.closest('#req-dd-menu')) closeReqDD(); if(!e.target.closest('.breed-wrap')){ ['breed-dd','e-breed-dd'].forEach(id=>{ const bd=document.getElementById(id); if(bd) bd.style.display='none'; }); } });
async function addRequest(){
  if(!reqSelDogs.size){ toast('Please select at least one dog.', true); return; }
  const ci=document.getElementById('req-ci').value, cit=document.getElementById('req-ci-t').value;
  const co=document.getElementById('req-co').value, cot=document.getElementById('req-co-t').value;
  if(!ci||!co){ toast('Please set check-in and check-out dates.', true); return; }
  const selDogList=[...reqSelDogs].map(id=>dogs.find(d=>d.id===id)).filter(Boolean);
  const rec={ id:Date.now().toString(), dog_id:selDogList[0].id, dog_name:selDogList.map(d=>d.dog_name).join(', '), owner_name:selDogList[0].owner_name, dog_ids:selDogList.map(d=>d.id), service:document.getElementById('req-svc').value, checkin:ci+'T'+cit, checkout:co+'T'+cot, notes:document.getElementById('req-notes').value.trim(), status:'pending', created_at:new Date().toISOString() };
  setSyncState('busy');
  try{ await dbAddReq(rec); requests.unshift(rec); setSyncState('ok'); document.getElementById('req-notes').value=''; reqSelDogs=new Set(); renderReqSel(); renderRequests(); updateBadges(); refreshActive(); toast('Reservation added!'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
function setReqView(arch){ reqShowArchived=arch; renderRequests(); }
function renderRequests(){
  const c=document.getElementById('req-list');
  const active=requests.filter(r=>r.status!=='completed'&&r.status!=='declined');
  const archived=requests.filter(r=>r.status==='completed'||r.status==='declined');
  const list=reqShowArchived?archived:active;
  // toggle header
  const toggle=`<div style="display:flex;gap:0;margin-bottom:12px;background:var(--cream-mid);border:1.5px solid var(--cream-dark);border-radius:var(--r3);padding:4px;width:fit-content"><button class="svc-btn${!reqShowArchived?' active':''}" onclick="setReqView(false)" style="flex:none;padding:7px 16px">Active (${active.length})</button><button class="svc-btn${reqShowArchived?' active':''}" onclick="setReqView(true)" style="flex:none;padding:7px 16px">Completed (${archived.length})</button></div>`;
  if(!list.length){ c.innerHTML=toggle+'<div class="es"><span class="ei">📩</span><p>'+(reqShowArchived?'No completed reservations yet.':'No active reservations. New requests appear here.')+'</p></div>'; return; }
  const fd=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const ft=s=>new Date(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  // Status display label map
  const statusLabel={pending:'Pending',confirmed:'Confirmed',checked_in:'Checked In',completed:'Completed',declined:'Declined'};
  const statusClass={pending:'pending',confirmed:'confirmed',checked_in:'confirmed',completed:'confirmed',declined:'declined'};
  c.innerHTML=toggle+list.map(r=>{
    const st=r.status||'pending';
    const lbl=statusLabel[st]||st;
    const cls=statusClass[st]||'pending';
    // actual times if present
    const actualIn=r.actual_checkin, actualOut=r.actual_checkout;
    let actualLine='';
    if(actualIn) actualLine+=`<span>✅ In: ${fd(actualIn)} ${ft(actualIn)}</span>`;
    if(actualOut) actualLine+=`<span>👋 Out: ${fd(actualOut)} ${ft(actualOut)}</span>`;
    const priceLine=r.final_total!=null?`<span style="font-weight:700;color:var(--ink)">💵 Final: $${parseFloat(r.final_total).toFixed(2)}</span>`:'';
    // action buttons by status
    let actions='';
    if(st==='pending'){
      actions=`<button class="btn btn-g sm" onclick="updateReq('${r.id}','confirmed')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>Confirm</button><button class="btn btn-d sm" onclick="updateReq('${r.id}','declined')">Decline</button>`;
    } else if(st==='confirmed'){
      actions=`<button class="btn btn-b sm" onclick="openCheckIn('${r.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Check In</button><button class="btn btn-o sm" onclick="updateReq('${r.id}','pending')">Unconfirm</button>`;
    } else if(st==='checked_in'){
      actions=`<button class="btn btn-g sm" onclick="openCheckOut('${r.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Check Out & Bill</button>`;
    } else if(st==='completed'){
      actions=r.booking_id?`<button class="btn btn-g sm" onclick="openInv('${r.booking_id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>View Invoice</button>`:'';
    } else if(st==='declined'){
      actions=`<button class="btn btn-o sm" onclick="updateReq('${r.id}','pending')">Reset to Pending</button>`;
    }
    const editBtn=st!=='completed'?`<button class="btn btn-o sm" onclick="openEditReq('${r.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit</button>`:'';
    return `<div class="req-card"><div class="req-header"><div><div class="req-title">${esc(r.dog_name)}</div><div class="req-sub">${esc(r.owner_name)}</div></div><span class="req-status ${cls}">${lbl}</span></div>
    <div class="req-meta"><span>${r.service==='boarding'?'🏡 Boarding':'☀️ Day Care'}</span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${fd(r.checkin)} ${ft(r.checkin)} → ${fd(r.checkout)} ${ft(r.checkout)}</span>${r.notes?`<span>📋 ${esc(r.notes)}</span>`:''}${actualLine}${priceLine}</div>
    <div class="hac">${actions}${editBtn}<button class="btn btn-d sm" onclick="delRequest('${r.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Delete</button></div></div>`;
  }).join('');
}
async function updateReq(id,status){
  setSyncState('busy');
  try{ await dbUpdReq(id,{status}); const r=requests.find(x=>x.id===id); if(r) r.status=status; setSyncState('ok'); renderRequests(); updateBadges(); if(typeof renderCalendar==='function'&&document.getElementById('pg-calendar').classList.contains('active')){renderCalendar();renderUpcoming();} toast('Reservation '+status.replace('_',' ')+'.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
async function delRequest(id){
  if(!confirm('Delete this reservation?')) return;
  setSyncState('busy');
  try{ await dbDelReq(id); requests=requests.filter(r=>r.id!==id); setSyncState('ok'); renderRequests(); updateBadges(); toast('Reservation deleted.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}

/* ── Check-in / Check-out workflow ── */
let cioReqId=null, cioMode=null, cioDiscType='pct';
function setDiscType(t){
  cioDiscType=t;
  document.getElementById('cio-disc-pct').classList.toggle('active',t==='pct');
  document.getElementById('cio-disc-amt').classList.toggle('active',t==='amt');
  cioUpdatePreview();
}
function applyDiscount(subtotal){
  const val=parseFloat(document.getElementById('cio-disc-val').value)||0;
  if(val<=0) return {discount:0, total:subtotal, type:cioDiscType, val:0};
  let discount = cioDiscType==='pct' ? subtotal*(val/100) : val;
  discount = Math.min(discount, subtotal); // never below zero
  discount = +discount.toFixed(2);
  return {discount, total:+(subtotal-discount).toFixed(2), type:cioDiscType, val};
}
function openCheckIn(id){
  const r=requests.find(x=>x.id===id); if(!r) return;
  cioReqId=id; cioMode='in';
  const now=new Date();
  document.getElementById('cio-title').textContent='Check In — '+r.dog_name;
  document.getElementById('cio-in-block').style.display='none';
  document.getElementById('cio-out-label').style.display='none';
  document.getElementById('cio-discount-block').style.display='none';
  document.getElementById('cio-date-lbl').textContent='Date';
  document.getElementById('cio-date').value=dStr(new Date(r.checkin));
  document.getElementById('cio-time').value=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  document.getElementById('cio-hint').textContent='Record the actual arrival date and time. Check-out and final billing happen when the dog leaves.';
  const rc=document.getElementById('cio-recall'); const cioIds=reqDogIds(r); if(cioIds.length){ rc.innerHTML=cioIds.map(id=>recallCard(id)).join('<div style="height:8px"></div>'); rc.style.display=''; } else rc.style.display='none';
  document.getElementById('cio-preview').style.display='none';
  document.getElementById('cio-save-lbl').textContent='Confirm Check-In';
  document.getElementById('cio-mo').classList.add('on');
}
function openCheckOut(id){
  const r=requests.find(x=>x.id===id); if(!r) return;
  cioReqId=id; cioMode='out';
  const cr=document.getElementById('cio-recall'); if(cr) cr.style.display='none';
  const now=new Date();
  document.getElementById('cio-title').textContent='Check Out — '+r.dog_name;
  const inSrc=new Date(r.actual_checkin||r.checkin);
  document.getElementById('cio-in-block').style.display='';
  document.getElementById('cio-in-date').value=dStr(inSrc);
  document.getElementById('cio-in-time').value=tStr(inSrc);
  document.getElementById('cio-out-label').style.display='';
  document.getElementById('cio-discount-block').style.display='';
  document.getElementById('cio-disc-val').value='';
  setDiscType('pct');
  document.getElementById('cio-date-lbl').textContent='Date';
  document.getElementById('cio-date').value=dStr(now);
  document.getElementById('cio-time').value=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  document.getElementById('cio-hint').textContent='Adjust the actual check-in and check-out times if needed. Final price is calculated from these.';
  document.getElementById('cio-save-lbl').textContent='Check Out & Generate Invoice';
  cioUpdatePreview();
  document.getElementById('cio-mo').classList.add('on');
}
function cioGetCheckinDate(){
  if(cioMode==='out'){
    const d=document.getElementById('cio-in-date').value, t=document.getElementById('cio-in-time').value;
    if(d&&t) return new Date(d+'T'+t);
  }
  const r=requests.find(x=>x.id===cioReqId);
  return r?new Date(r.actual_checkin||r.checkin):new Date();
}
function reqDogIds(r){ return (r.dog_ids&&r.dog_ids.length)?r.dog_ids:(r.dog_id?[r.dog_id]:[]); }
function cioUpdatePreview(){
  const prev=document.getElementById('cio-preview');
  if(cioMode!=='out'){ prev.style.display='none'; return; }
  const r=requests.find(x=>x.id===cioReqId); if(!r) return;
  const inDt=cioGetCheckinDate();
  const d=document.getElementById('cio-date').value, t=document.getElementById('cio-time').value;
  if(!d||!t||isNaN(inDt)){ prev.style.display='none'; return; }
  const outDt=new Date(d+'T'+t);
  if(isNaN(outDt)||outDt<=inDt){ prev.style.display='block'; prev.innerHTML='<span style="color:var(--danger)">Check-out must be after check-in.</span>'; return; }
  const ids=reqDogIds(r);
  const results=ids.map(id=>{ const dg=dogs.find(x=>x.id===id); return {dog:dg,...calcDogSvc(dg,inDt,outDt,r.service)}; });
  const subtotal=results.reduce((s,x)=>s+x.total,0);
  const disc=applyDiscount(subtotal);
  prev.style.display='block';
  let rows=`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);margin-bottom:6px">Final Price Preview</div><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-mid);margin-bottom:3px"><span>Actual stay</span><span>${inDt.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} &rarr; ${outDt.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</span></div>`;
  results.forEach(x=>{ rows+=`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-mid);margin-bottom:3px"><span>${esc(x.dog?x.dog.dog_name:'Dog')} &middot; ${x.fullDays}d${x.extraHrs>0?' + '+x.extraHrs+'h':''}${x.surcharge>0?' (+$'+x.surcharge.toFixed(2)+')':''}</span><span>$${x.total.toFixed(2)}</span></div>`; });
  if(disc.discount>0) rows+=`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--coral);margin-bottom:3px"><span>Discount${disc.type==='pct'?' ('+disc.val+'%)':''}</span><span>&minus;$${disc.discount.toFixed(2)}</span></div>`;
  rows+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--cream-dark)"><span style="font-size:13px;font-weight:600">Total Due</span><span style="font-family:'DM Serif Display',serif;font-size:22px;color:var(--ink)">$${disc.total.toFixed(2)}</span></div>`;
  prev.innerHTML=rows;
}
function closeCio(){ document.getElementById('cio-mo').classList.remove('on'); cioReqId=null; cioMode=null; }
async function saveCio(){
  const r=requests.find(x=>x.id===cioReqId); if(!r) return;
  const d=document.getElementById('cio-date').value, t=document.getElementById('cio-time').value;
  if(!d||!t){ toast('Please set date and time.', true); return; }
  const stamp=new Date(d+'T'+t);
  if(isNaN(stamp)){ toast('Invalid date/time.', true); return; }
  setSyncState('busy');
  try{
    if(cioMode==='in'){
      await dbUpdReq(r.id,{status:'checked_in', actual_checkin:stamp.toISOString()});
      r.status='checked_in'; r.actual_checkin=stamp.toISOString();
      setSyncState("ok"); closeCio(); renderRequests(); updateBadges(); refreshActive(); toast(r.dog_name+" checked in!");
    } else {
      const inDt=cioGetCheckinDate();
      if(isNaN(inDt)){ setSyncState('ok'); toast('Please set a valid check-in time.', true); return; }
      if(stamp<=inDt){ setSyncState('ok'); toast('Check-out must be after check-in.', true); return; }
      const ids=reqDogIds(r);
      const results=ids.map(id=>{ const dg=dogs.find(x=>x.id===id); return {dog:dg,...calcDogSvc(dg,inDt,stamp,r.service)}; });
      const subtotal=results.reduce((s,x)=>s+x.total,0);
      const disc=applyDiscount(subtotal);
      const entries=results.map(x=>{ const share=subtotal>0?x.total/subtotal:0; const dDisc=+(disc.discount*share).toFixed(2); return {dogId:x.dog?x.dog.id:null,dogName:x.dog?x.dog.dog_name:'',ownerName:x.dog?x.dog.owner_name:r.owner_name,phone:x.dog?x.dog.phone:'',photo:x.dog?x.dog.photo:null,notes:x.dog?x.dog.notes:'',rate:x.rate,fullDays:x.fullDays,extraHrs:x.extraHrs,surcharge:x.surcharge,total:x.total,subtotal:x.total,discount:dDisc}; });
      if(entries[0]){ entries[0].requested_checkin=r.checkin; entries[0].requested_checkout=r.checkout; entries[0].discount_type=disc.type; entries[0].discount_val=disc.val; }
      const booking={ id:Date.now().toString(), saved_at:new Date().toISOString(), service:r.service, checkin:inDt.toISOString(), checkout:stamp.toISOString(), grand_total:disc.total, requested_checkin:r.checkin, requested_checkout:r.checkout, entries:entries };
      try {
        await dbInsertBooking(booking);
      } catch(insErr) {
        setSyncState('err'); console.error('Booking insert failed:', insErr);
        toast('Could not save booking: '+insErr.message, true); return;
      }
      bookings.unshift(booking);
      try {
        await dbUpdReq(r.id,{status:'completed', actual_checkin:inDt.toISOString(), actual_checkout:stamp.toISOString(), final_total:disc.total, booking_id:booking.id});
      } catch(updErr) { console.warn('Reservation status update failed (non-fatal):', updErr); }
      r.status='completed'; r.actual_checkin=inDt.toISOString(); r.actual_checkout=stamp.toISOString(); r.final_total=disc.total; r.booking_id=booking.id;
      setSyncState('ok'); closeCio(); renderRequests(); updateBadges(); refreshActive();
      toast('Checked out! Final: $'+disc.total.toFixed(2));
      try { openInv(booking.id); } catch(invErr) { console.warn('Invoice open failed:', invErr); }
    }
  }catch(e){ setSyncState('err'); console.error('Checkout error:',e); toast('Error: '+e.message, true); }
}

/* ── Edit reservation ── */
let editReqId=null;
function openEditReq(id){
  const r=requests.find(x=>x.id===id); if(!r) return;
  editReqId=id;
  document.getElementById('er-svc').value=r.service||'boarding';
  document.getElementById('er-ci').value=dStr(new Date(r.checkin));
  document.getElementById('er-ci-t').value=tStr(new Date(r.checkin));
  document.getElementById('er-co').value=dStr(new Date(r.checkout));
  document.getElementById('er-co-t').value=tStr(new Date(r.checkout));
  document.getElementById('er-notes').value=r.notes||'';
  document.getElementById('er-dogname').textContent=r.dog_name+' · '+r.owner_name;
  document.getElementById('editreq-mo').classList.add('on');
}
function closeEditReq(){ document.getElementById('editreq-mo').classList.remove('on'); editReqId=null; }
async function saveEditReq(){
  const r=requests.find(x=>x.id===editReqId); if(!r) return;
  const ci=document.getElementById('er-ci').value, cit=document.getElementById('er-ci-t').value;
  const co=document.getElementById('er-co').value, cot=document.getElementById('er-co-t').value;
  if(!ci||!co||!cit||!cot){ toast('Please set all dates and times.', true); return; }
  const upd={ service:document.getElementById('er-svc').value, checkin:ci+'T'+cit, checkout:co+'T'+cot, notes:document.getElementById('er-notes').value.trim()||null };
  setSyncState('busy');
  try{
    await dbUpdReq(r.id, upd);
    Object.assign(r, upd);
    setSyncState('ok'); closeEditReq(); renderRequests(); updateBadges();
    if(document.getElementById('pg-calendar').classList.contains('active')){renderCalendar();renderUpcoming();}
    toast('Reservation updated.');
  }catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
function tStr(d){ return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }

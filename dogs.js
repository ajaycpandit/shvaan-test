/* ═══════════════════════════════════════
   HISTORY
═══════════════════════════════════════ */
let histFilterDogs=new Set(), histFilterOwners=new Set(), histDdOpen=false, histoDdOpen=false;
// Build a sorted unique owner list from dogs + bookings
function allOwnerNames(){
  const s=new Set();
  dogs.forEach(d=>{ if(d.owner_name) s.add(d.owner_name); });
  bookings.forEach(b=>(b.entries||[]).forEach(e=>{ if(e.ownerName) s.add(e.ownerName); }));
  return [...s].sort((a,b)=>a.localeCompare(b));
}
/* Dog dropdown */
function renderHistDDList(){
  const list=document.getElementById('hist-dd-list'); if(!list) return;
  const q=(document.getElementById('hist-dd-search')?.value||'').toLowerCase().trim();
  const filtered=dogs.filter(d=>!q||(d.dog_name||'').toLowerCase().includes(q)||(d.owner_name||'').toLowerCase().includes(q));
  if(!filtered.length){ list.innerHTML='<div style="padding:14px;text-align:center;font-size:13px;color:var(--ink-faint)">No dogs match</div>'; return; }
  list.innerHTML=filtered.map(d=>`<div class="dd-item${histFilterDogs.has(d.dog_name)?' sel':''}" onclick="toggleHistDog('${esc(d.dog_name).replace(/'/g,"\\'")}')"><div class="dd-ava">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div><div style="flex:1;min-width:0"><div class="dd-name">${esc(d.dog_name)}</div><div class="dd-sub">${esc(d.owner_name)}</div></div><div class="dd-chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div></div>`).join('');
}
function toggleHistDD(){ histDdOpen=!histDdOpen; document.getElementById('hist-dd-menu').style.display=histDdOpen?'block':'none'; document.getElementById('hist-dd-btn').classList.toggle('open',histDdOpen); if(histDdOpen){ const s=document.getElementById('hist-dd-search'); if(s){ s.value=''; renderHistDDList(); setTimeout(()=>s.focus(),50);} } }
function toggleHistDog(name){ if(histFilterDogs.has(name)) histFilterDogs.delete(name); else histFilterDogs.add(name); renderHistDDList(); renderHistFilterUI(); renderHistory(); }
/* Owner dropdown */
function renderHistoDDList(){
  const list=document.getElementById('histo-dd-list'); if(!list) return;
  const q=(document.getElementById('histo-dd-search')?.value||'').toLowerCase().trim();
  const owners=allOwnerNames().filter(o=>!q||o.toLowerCase().includes(q));
  if(!owners.length){ list.innerHTML='<div style="padding:14px;text-align:center;font-size:13px;color:var(--ink-faint)">No owners match</div>'; return; }
  list.innerHTML=owners.map(o=>`<div class="dd-item${histFilterOwners.has(o)?' sel':''}" onclick="toggleHistOwner('${esc(o).replace(/'/g,"\\'")}')"><div class="dd-ava">👤</div><div style="flex:1;min-width:0"><div class="dd-name">${esc(o)}</div></div><div class="dd-chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div></div>`).join('');
}
function toggleHistoDD(){ histoDdOpen=!histoDdOpen; document.getElementById('histo-dd-menu').style.display=histoDdOpen?'block':'none'; document.getElementById('histo-dd-btn').classList.toggle('open',histoDdOpen); if(histoDdOpen){ const s=document.getElementById('histo-dd-search'); if(s){ s.value=''; renderHistoDDList(); setTimeout(()=>s.focus(),50);} } }
function toggleHistOwner(name){ if(histFilterOwners.has(name)) histFilterOwners.delete(name); else histFilterOwners.add(name); renderHistoDDList(); renderHistFilterUI(); renderHistory(); }
function renderHistFilterUI(){
  const dl=document.getElementById('hist-dd-lbl'), ol=document.getElementById('histo-dd-lbl');
  if(dl){ dl.textContent=histFilterDogs.size?histFilterDogs.size+' dog'+(histFilterDogs.size>1?'s':''):'All dogs'; dl.style.color=histFilterDogs.size?'var(--ink)':'var(--ink-faint)'; }
  if(ol){ ol.textContent=histFilterOwners.size?histFilterOwners.size+' owner'+(histFilterOwners.size>1?'s':''):'All owners'; ol.style.color=histFilterOwners.size?'var(--ink)':'var(--ink-faint)'; }
  const tags=document.getElementById('hist-filter-tags'); if(!tags) return;
  let html='';
  html+=[...histFilterDogs].map(n=>`<span class="sel-tag">🐶 ${esc(n)}<span class="sel-tag-x" onclick="toggleHistDog('${esc(n).replace(/'/g,"\\'")}')">×</span></span>`).join('');
  html+=[...histFilterOwners].map(n=>`<span class="sel-tag">👤 ${esc(n)}<span class="sel-tag-x" onclick="toggleHistOwner('${esc(n).replace(/'/g,"\\'")}')">×</span></span>`).join('');
  tags.innerHTML=html;
}
function renderHistory() {
  const c=document.getElementById('hist-wrap'), cnt=document.getElementById('hist-cnt');
  renderHistFilterUI();
  if(!bookings.length){c.innerHTML='<div class="es"><span class="ei">📋</span><p>No bookings saved yet.</p></div>';cnt.textContent='0 bookings';return;}
  const paidF=document.getElementById('hist-paid')?.value||'all';
  const svcF=document.getElementById('hist-svc')?.value||'all';
  const anyFilter=histFilterDogs.size||histFilterOwners.size||paidF!=='all'||svcF!=='all';
  let list=bookings.filter(b=>{
    if(svcF!=='all' && b.service!==svcF) return false;
    if(paidF==='paid' && !b.paid) return false;
    if(paidF==='unpaid' && b.paid) return false;
    const ents=b.entries||[];
    if(histFilterDogs.size && !ents.some(e=>histFilterDogs.has(e.dogName||e.dog_name||''))) return false;
    if(histFilterOwners.size && !ents.some(e=>histFilterOwners.has(e.ownerName||''))) return false;
    return true;
  });
  cnt.textContent=anyFilter?list.length+' of '+bookings.length+' bookings':bookings.length+' booking'+(bookings.length!==1?'s':'');
  if(!list.length){c.innerHTML='<div class="es"><span class="ei">🔍</span><p>No bookings match your filter.</p></div>';return;}
  const fd=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const ft=s=>new Date(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  c.innerHTML='<div style="display:flex;flex-direction:column;gap:11px">'+list.map(b=>{
    const entries=b.entries||[];
    const svcPill=b.service==='boarding'?'<span class="sp sp-b">🏡 Boarding</span>':'<span class="sp sp-d">☀️ Day Care</span>';
    const dpills=entries.map(e=>`<div class="hdp"><div class="hdpa">${e.photo?`<img src="${e.photo}" alt="">`:'🐶'}</div><span class="hdn">${esc(e.dogName||e.dog_name||'')}</span></div>`).join('');
    return `<div class="hi">
      <div class="hh">
        <div class="hdogs">${dpills}</div>
        <div style="text-align:right"><div class="hamount">$${parseFloat(b.grand_total).toFixed(2)}</div>${b.paid?`<div style="font-size:10px;font-weight:600;color:var(--forest);margin-top:2px">✓ Paid${b.payment_method?' · '+esc(b.payment_method):''}</div>`:'<div style="font-size:10px;font-weight:600;color:var(--danger);margin-top:2px">● Unpaid</div>'}</div>
      </div>
      <div class="hmeta">
        <span>${svcPill}</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${fd(b.checkin)} ${ft(b.checkin)} → ${fd(b.checkout)} ${ft(b.checkout)}</span>
      </div>
      <div class="hac">
        ${b.paid?`<button class="btn btn-o sm" onclick="markUnpaid('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><circle cx="12" cy="12" r="10"/></svg>Mark Unpaid</button>`:`<button class="btn btn-g sm" onclick="openPayment('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg>Mark Paid</button>`}
        <button class="btn btn-g sm" onclick="openInv('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>Invoice</button>
        <button class="btn btn-o sm" onclick="openEditBooking('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit Dates</button>
        <button class="btn btn-o sm" onclick="printDirect('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print</button>
        <button class="btn btn-d sm" onclick="deleteBooking('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Delete</button>
      </div>
    </div>`;
  }).join('')+'</div>';
}

async function deleteBooking(id) {
  if(!confirm('Delete this booking?')) return;
  setSyncState('busy');
  try { await dbDeleteBooking(id); bookings=bookings.filter(b=>b.id!==id); setSyncState('ok'); renderHistory(); updateBadges(); toast('Booking deleted.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message,true); }
}

/* ── Payment tracking ── */
let payBkId=null;
function openPayment(id){
  const b=bookings.find(x=>x.id===id); if(!b) return;
  payBkId=id;
  const names=(b.entries||[]).map(e=>e.dogName||'').join(', ');
  document.getElementById('pay-summary').innerHTML=`<div style="font-size:13px;font-weight:600;color:var(--ink)">${esc(names)}</div><div style="font-size:12px;color:var(--ink-faint);margin-top:2px">Amount due: <strong style="color:var(--ink)">$${parseFloat(b.grand_total).toFixed(2)}</strong></div>`;
  document.getElementById('pay-date').value=dStr(new Date());
  document.getElementById('pay-method').value='Cash';
  document.getElementById('pay-mo').classList.add('on');
}
function closePayment(){ document.getElementById('pay-mo').classList.remove('on'); payBkId=null; }
async function savePayment(){
  const b=bookings.find(x=>x.id===payBkId); if(!b) return;
  const upd={ paid:true, payment_method:document.getElementById('pay-method').value, paid_at:document.getElementById('pay-date').value||dStr(new Date()) };
  setSyncState('busy');
  try{
    await dbUpdateBooking(b.id, upd);
    Object.assign(b, upd);
    setSyncState('ok'); closePayment(); renderHistory(); refreshActive(); toast('Payment recorded.');
  }catch(e){ setSyncState('err'); toast('Could not save payment: '+e.message+' (did you add the paid columns?)', true); }
}
async function markUnpaid(id){
  const b=bookings.find(x=>x.id===id); if(!b) return;
  if(!confirm('Mark this invoice as unpaid?')) return;
  setSyncState('busy');
  try{ await dbUpdateBooking(id,{paid:false,payment_method:null,paid_at:null}); b.paid=false; b.payment_method=null; b.paid_at=null; setSyncState('ok'); renderHistory(); refreshActive(); toast('Marked unpaid.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
document.getElementById('pay-mo').addEventListener('click',function(e){ if(e.target===this) closePayment(); });

async function clearHistory() {
  if(!confirm('Clear ALL booking history? This cannot be undone.')) return;
  setSyncState('busy');
  try { await dbDeleteAllBookings(); bookings=[]; setSyncState('ok'); renderHistory(); updateBadges(); toast('History cleared.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message,true); }
}

/* ── Export / Import past bookings (Excel) ── */
function fmtDT(d){ d=new Date(d); if(isNaN(d)) return ''; const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes()); }
async function downloadBookingTemplate(){
  try{
    const XLSX=await getXLSX();
    const rows=[
      ['Date','Dog(s)','Owner','Service','Check-In','Check-Out','Amount','Paid','Method'],
      ['2026-06-08','Buddy','Sarah Johnson','Boarding','2026-06-06 10:00','2026-06-08 11:00',165,'Yes','Cash'],
      ['2026-06-09','Luna, Max','Mike Lee','Day Care','2026-06-09 08:00','2026-06-09 17:00',70,'No',''],
      ['','(dog name; comma-separate multiple)','(owner name)','Boarding or Day Care','YYYY-MM-DD HH:MM','YYYY-MM-DD HH:MM','(number only)','Yes/No','Cash/Card/Venmo/Zelle/Other']
    ];
    const ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=[{wch:12},{wch:24},{wch:18},{wch:13},{wch:18},{wch:18},{wch:10},{wch:7},{wch:24}];
    // Force date columns to text so Excel keeps the literal YYYY-MM-DD HH:MM strings
    const range=XLSX.utils.decode_range(ws['!ref']);
    for(let R=1; R<=range.e.r; R++){ ['A','E','F'].forEach(C=>{ const cell=ws[C+(R+1)]; if(cell){ cell.t='s'; } }); }
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Bookings');
    XLSX.writeFile(wb,'shvaan-import-template.xlsx');
    toast('Template downloaded.');
  }catch(e){ toast('Could not create template: '+e.message, true); }
}
async function exportBookings(){
  if(!bookings.length){ toast('No bookings to export.', true); return; }
  try{
    const XLSX=await getXLSX();
    const rows=[['Date','Dog(s)','Owner','Service','Check-In','Check-Out','Amount','Paid','Method']];
    bookings.forEach(b=>{
      rows.push([
        fmtDT(b.checkout||b.saved_at).slice(0,10),
        (b.entries||[]).map(e=>e.dogName||'').join(', '),
        (b.entries||[])[0]?.ownerName||'',
        b.service==='boarding'?'Boarding':'Day Care',
        fmtDT(b.checkin),
        fmtDT(b.checkout),
        parseFloat(b.grand_total||0),
        b.paid?'Yes':'No',
        b.payment_method||''
      ]);
    });
    const ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=[{wch:12},{wch:20},{wch:18},{wch:11},{wch:18},{wch:18},{wch:10},{wch:7},{wch:12}];
    // Force the date columns (A, E, F) to be stored as text so Excel won't reconvert them
    const range=XLSX.utils.decode_range(ws['!ref']);
    for(let R=1; R<=range.e.r; R++){ ['A','E','F'].forEach(C=>{ const cell=ws[C+(R+1)]; if(cell){ cell.t='s'; } }); }
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Bookings');
    XLSX.writeFile(wb,'shvaan-bookings-'+new Date().toISOString().slice(0,10)+'.xlsx');
    toast('Exported '+bookings.length+' booking'+(bookings.length!==1?'s':'')+'.');
  }catch(e){ toast('Export failed: '+e.message, true); }
}
async function importBookings(input){
  const file=input.files[0]; if(!file) return;
  const re=document.getElementById('bk-import-result'); re.style.display='none';
  try{
    const XLSX=await getXLSX();
    const buf=await file.arrayBuffer(), wb=XLSX.read(buf,{type:'array', cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]], rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false,dateNF:'yyyy-mm-dd hh:mm'});
    if(rows.length<2) throw new Error('Spreadsheet appears empty.');
    const hdrs=rows[0].map(h=>String(h).toLowerCase().trim());
    const col=names=>{for(const n of names){const i=hdrs.indexOf(n);if(i!==-1)return i;}return -1;};
    const dgc=col(['dog(s)','dog','dogs','dog name']), oc=col(['owner','owner name']), sc=col(['service']), cic=col(['check-in','checkin','check in']), coc=col(['check-out','checkout','check out']), amc=col(['amount','total','grand total']), pc=col(['paid']), mc=col(['method','payment method']);
    if(dgc===-1||cic===-1||coc===-1||amc===-1) throw new Error('Need at least Dog(s), Check-In, Check-Out, and Amount columns.');
    const toAdd=[]; let badDates=0;
    rows.slice(1).forEach(r=>{
      const dn=String(r[dgc]||'').trim(); if(!dn) return;
      const ci=parseFlexibleDate(r[cic]), co=parseFlexibleDate(r[coc]);
      if(!ci||!co){ badDates++; return; }
      const amt=parseFloat(String(r[amc]).replace(/[^0-9.]/g,''))||0;
      const svc=String(r[sc]||'boarding').toLowerCase().includes('day')?'daycare':'boarding';
      const paid=['yes','true','1','paid','y'].includes(String(r[pc]||'').toLowerCase().trim());
      toAdd.push({ id:Date.now().toString()+Math.random().toString(36).slice(2), saved_at:co.toISOString(), service:svc, checkin:ci.toISOString(), checkout:co.toISOString(), grand_total:amt, paid:paid, payment_method:mc!==-1?String(r[mc]||'').trim()||null:null, imported:true,
        entries:[{dogName:dn, ownerName:oc!==-1?String(r[oc]||'').trim():'', rate:0, fullDays:0, extraHrs:0, surcharge:0, total:amt}] });
    });
    if(!toAdd.length) throw new Error(badDates?('No valid rows — '+badDates+' row(s) had unreadable dates. Use format YYYY-MM-DD HH:MM (e.g. 2026-06-10 14:00).'):'No valid rows found.');
    setSyncState('busy');
    for(const b of toAdd){ await dbInsertBooking(b); bookings.unshift(b); }
    setSyncState('ok');
    renderHistory(); updateBadges();
    re.style.display='block'; re.style.color='var(--forest)';
    re.innerHTML='✅ Imported <strong>'+toAdd.length+'</strong> past booking'+(toAdd.length!==1?'s':'')+(badDates?' ('+badDates+' skipped — bad dates)':'')+'.';
    toast('Imported '+toAdd.length+' booking'+(toAdd.length!==1?'s':'')+'.');
  }catch(e){ const re2=document.getElementById('bk-import-result'); re2.style.display='block'; re2.style.color='var(--danger)'; re2.textContent='⚠️ '+e.message; setSyncState('ok'); }
  input.value='';
}
/* Accepts: JS Date, Excel serial number, ISO text, US-format text, etc. Returns a valid Date or null. */
function parseFlexibleDate(v){
  if(v==null||v==='') return null;
  if(v instanceof Date) return isNaN(v)?null:v;
  // Excel serial number (days since 1899-12-30). Treat plausible range only.
  if(typeof v==='number' || (/^\d+(\.\d+)?$/.test(String(v).trim()))){
    const n=parseFloat(v);
    if(n>20000 && n<80000){ // ~1954 to ~2119, sane booking range
      const ms=Math.round((n-25569)*86400*1000); // 25569 = days between 1899-12-30 and 1970-01-01
      const d=new Date(ms);
      return isNaN(d)?null:d;
    }
  }
  // Text date — try native parse first
  let s=String(v).trim();
  let d=new Date(s);
  if(!isNaN(d)) return d;
  // Try common explicit formats: YYYY-MM-DD [HH:MM], MM/DD/YYYY [HH:MM]
  let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m){ d=new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0)); return isNaN(d)?null:d; }
  m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m){ d=new Date(+m[3],+m[1]-1,+m[2],+(m[4]||0),+(m[5]||0)); return isNaN(d)?null:d; }
  return null;
}
/* Close history filter dropdowns when clicking outside */
document.addEventListener('click', e=>{
  if(!e.target.closest('#hist-dd-btn')&&!e.target.closest('#hist-dd-menu')){ histDdOpen=false; const m=document.getElementById('hist-dd-menu'); if(m) m.style.display='none'; const b=document.getElementById('hist-dd-btn'); if(b) b.classList.remove('open'); }
  if(!e.target.closest('#histo-dd-btn')&&!e.target.closest('#histo-dd-menu')){ histoDdOpen=false; const m=document.getElementById('histo-dd-menu'); if(m) m.style.display='none'; const b=document.getElementById('histo-dd-btn'); if(b) b.classList.remove('open'); }
});

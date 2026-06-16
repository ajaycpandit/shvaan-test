/* ═══════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════ */
function sameDay(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function onSiteReservations(){ return requests.filter(r=>r.status==='checked_in'); }
function renderDashboard(){
  const now=new Date(), todayStr=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const hr=now.getHours();
  const greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
  // Arrivals today: confirmed reservations whose scheduled check-in is today (not yet checked in)
  const arrivals=requests.filter(r=>r.status==='confirmed'&&sameDay(new Date(r.checkin),now));
  // Departures today: checked-in dogs whose scheduled checkout is today
  const departures=requests.filter(r=>r.status==='checked_in'&&sameDay(new Date(r.checkout),now));
  const onSite=onSiteReservations();
  const cap=settings.capacity||12;
  const occPct=Math.min(100,Math.round(onSite.length/cap*100));
  // Revenue today (bookings checked out today) and MTD
  const todayRev=bookings.filter(b=>sameDay(new Date(b.checkout||b.saved_at),now)).reduce((s,b)=>s+parseFloat(b.grand_total||0),0);
  const mStart=new Date(now.getFullYear(),now.getMonth(),1);
  const mtdRev=bookings.filter(b=>{const d=new Date(b.checkout||b.saved_at);return d>=mStart&&d<=now;}).reduce((s,b)=>s+parseFloat(b.grand_total||0),0);
  // last month same-period for trend
  const lmStart=new Date(now.getFullYear(),now.getMonth()-1,1), lmEnd=new Date(now.getFullYear(),now.getMonth()-1,now.getDate(),23,59,59);
  const lmRev=bookings.filter(b=>{const d=new Date(b.checkout||b.saved_at);return d>=lmStart&&d<=lmEnd;}).reduce((s,b)=>s+parseFloat(b.grand_total||0),0);
  const trend=lmRev>0?Math.round((mtdRev-lmRev)/lmRev*100):null;
  const pending=requests.filter(r=>r.status==='pending').length;

  document.getElementById('dash-greeting').textContent=greet+'! 🐾';
  document.getElementById('dash-summary').textContent=`${todayStr} · ${arrivals.length} arrival${arrivals.length!==1?'s':''}, ${departures.length} departure${departures.length!==1?'s':''}, ${onSite.length} on-site, $${todayRev.toFixed(2)} collected today`;

  // Attention banner
  const overdue=onSite.filter(r=>new Date(r.checkout)<now);
  const noVacc=onSite.filter(r=>{ const exp=v=>v&&new Date(v)<now; return reqDogIds(r).some(id=>{ const d=dogs.find(x=>x.id===id); return d&&(exp(d.vacc_rabies)||exp(d.vacc_dhpp)||exp(d.vacc_bordetella)); }); });
  const att=[];
  if(overdue.length) att.push(`${overdue.length} overdue checkout${overdue.length!==1?'s':''}`);
  if(pending) att.push(`${pending} pending request${pending!==1?'s':''}`);
  if(noVacc.length) att.push(`${noVacc.length} on-site dog${noVacc.length!==1?'s':''} with expired vaccines`);
  if(onSite.length>cap) att.push(`Over capacity by ${onSite.length-cap}`);
  document.getElementById('dash-attention').innerHTML = att.length?`<div class="card" style="border-color:#EAB0AC;background:var(--danger-pale);margin-bottom:14px"><div style="display:flex;align-items:center;gap:9px"><span style="font-size:18px">⚠️</span><div style="font-size:13px;color:var(--danger);font-weight:600">Needs attention: ${att.join(' · ')}</div></div></div>`:'';

  // KPI cards
  const kpi=(label,val,sub,color)=>`<div class="card" style="margin:0;padding:16px 14px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-faint)">${label}</div><div style="font-family:'DM Serif Display',serif;font-size:26px;color:${color||'var(--ink)'};margin-top:3px;line-height:1.1">${val}</div>${sub?`<div style="font-size:11px;color:var(--ink-faint);margin-top:3px">${sub}</div>`:''}</div>`;
  document.getElementById('dash-kpis').innerHTML=
    kpi('Today',`$${todayRev.toFixed(0)}`,'collected','var(--brown-dark)')+
    kpi('This Month',`$${mtdRev.toFixed(0)}`,trend!=null?`${trend>=0?'▲':'▼'} ${Math.abs(trend)}% vs last`:'month to date',trend!=null&&trend<0?'var(--danger)':'var(--brown-dark)')+
    kpi('Occupancy',`${occPct}%`,`${onSite.length} of ${cap} spaces`)+
    kpi('Requests',pending,'pending');

  // Ops: arrivals & departures with actions
  const arrRow=arrivals.length?arrivals.map(r=>{
    const dog=dogs.find(x=>x.id===r.dog_id);
    return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--cream-mid)"><div class="dd-ava" style="width:30px;height:30px;font-size:14px">${dog&&dog.photo?`<img src="${dog.photo}" alt="">`:'🐶'}</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">${esc(r.dog_name)}</div><div style="font-size:11px;color:var(--ink-faint)">${new Date(r.checkin).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})} · ${r.service==='boarding'?'Boarding':'Day Care'}</div></div><button class="btn btn-b sm" onclick="openCheckIn('${r.id}')">Check In</button></div>`;
  }).join(''):'<div style="font-size:12px;color:var(--ink-faint);padding:10px 0">No arrivals scheduled today 🐾</div>';
  const depRow=departures.length?departures.map(r=>{
    const dog=dogs.find(x=>x.id===r.dog_id);
    const overdueTag=new Date(r.checkout)<now?' <span class="bdg bdg-r" style="background:var(--danger-pale);color:var(--danger);border:1px solid #EAB0AC">overdue</span>':'';
    return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--cream-mid)"><div class="dd-ava" style="width:30px;height:30px;font-size:14px">${dog&&dog.photo?`<img src="${dog.photo}" alt="">`:'🐶'}</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">${esc(r.dog_name)}${overdueTag}</div><div style="font-size:11px;color:var(--ink-faint)">${new Date(r.checkout).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div></div><button class="btn btn-g sm" onclick="openCheckOut('${r.id}')">Check Out</button></div>`;
  }).join(''):'<div style="font-size:12px;color:var(--ink-faint);padding:10px 0">No departures today</div>';
  document.getElementById('dash-ops').innerHTML=
    `<div class="card" style="margin-bottom:14px"><div class="ct"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Arrivals Today (${arrivals.length})</div>${arrRow}</div>`+
    `<div class="card" style="margin-bottom:14px"><div class="ct"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Departures Today (${departures.length})</div>${depRow}</div>`;

  // Revenue chart (last 6 months)
  const byMonth={};
  for(let k=5;k>=0;k--){ const d=new Date(now.getFullYear(),now.getMonth()-k,1); byMonth[d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')]=0; }
  bookings.forEach(b=>{ const d=new Date(b.checkout||b.saved_at); const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(key in byMonth) byMonth[key]+=parseFloat(b.grand_total||0); });
  const months=Object.keys(byMonth); const max=Math.max(1,...months.map(m=>byMonth[m]));
  document.getElementById('dash-chart').innerHTML='<div style="display:flex;align-items:flex-end;gap:8px;height:130px;padding-top:8px">'+months.map(m=>{
    const h=Math.round(byMonth[m]/max*100);
    const lbl=new Date(m+'-01T12:00:00').toLocaleDateString('en-US',{month:'short'});
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:10px;font-weight:600;color:var(--ink-mid)">$${Math.round(byMonth[m])}</div><div style="width:100%;max-width:48px;height:${h}px;background:linear-gradient(var(--brown),var(--brown-dark));border-radius:5px 5px 0 0;min-height:3px"></div><div style="font-size:10px;color:var(--ink-faint)">${lbl}</div></div>`;
  }).join('')+'</div>';

  // Occupancy outlook (next 14 days)
  let occHtml='<div style="display:flex;gap:3px;overflow-x:auto;padding:4px 0">';
  for(let i=0;i<14;i++){
    const day=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);
    // count reservations (confirmed/checked_in) + bookings overlapping this day
    let count=0;
    requests.filter(r=>r.status==='confirmed'||r.status==='checked_in').forEach(r=>{ const ci=new Date(r.actual_checkin||r.checkin), co=new Date(r.checkout); if(day>=new Date(ci.getFullYear(),ci.getMonth(),ci.getDate())&&day<=new Date(co.getFullYear(),co.getMonth(),co.getDate())) count++; });
    const pct=Math.min(100,Math.round(count/cap*100));
    const barColor=pct>=100?'var(--danger)':pct>=70?'var(--gold)':'var(--brown)';
    const h=Math.max(4,Math.round(pct/100*70));
    occHtml+=`<div style="flex:1;min-width:34px;display:flex;flex-direction:column;align-items:center;gap:3px"><div style="font-size:9px;color:var(--ink-faint)">${count}</div><div style="display:flex;align-items:flex-end;height:72px"><div style="width:20px;height:${h}px;background:${barColor};border-radius:3px 3px 0 0"></div></div><div style="font-size:9px;font-weight:600;color:${i===0?'var(--brown-dark)':'var(--ink-faint)'}">${day.toLocaleDateString('en-US',{weekday:'narrow'})}</div><div style="font-size:9px;color:var(--ink-faint)">${day.getDate()}</div></div>`;
  }
  occHtml+='</div><div style="font-size:11px;color:var(--ink-faint);margin-top:6px">Dogs booked per day vs capacity of '+cap+'. <span style="color:var(--gold)">●</span> 70%+ &nbsp; <span style="color:var(--danger)">●</span> full</div>';
  document.getElementById('dash-occupancy').innerHTML=occHtml;

  // Lower: vaccination watch + recent activity
  const vaccItems=[];
  dogs.forEach(d=>{ [['Rabies',d.vacc_rabies],['DHPP',d.vacc_dhpp],['Bordetella',d.vacc_bordetella]].forEach(([nm,dt])=>{ if(!dt)return; const diff=Math.ceil((new Date(dt)-now)/86400000); if(diff<=30) vaccItems.push({d,nm,diff}); }); });
  vaccItems.sort((a,b)=>a.diff-b.diff);
  const vaccHtml=vaccItems.length?vaccItems.slice(0,6).map(v=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--cream-mid)"><span class="vbdg ${v.diff<0?'exp':'warn'}">${v.nm}</span><div style="flex:1;min-width:0;font-size:12px;color:var(--ink);font-weight:600">${esc(v.d.dog_name)}</div><div style="font-size:11px;color:${v.diff<0?'var(--danger)':'var(--gold)'}">${v.diff<0?'expired':'in '+v.diff+'d'}</div></div>`).join(''):'<div style="font-size:12px;color:var(--ink-faint);padding:10px 0">✅ All vaccinations current</div>';
  // Recent activity from bookings (most recent checkouts)
  const recent=[...bookings].sort((a,b)=>new Date(b.saved_at||b.checkout)-new Date(a.saved_at||a.checkout)).slice(0,6);
  const actHtml=recent.length?recent.map(b=>{
    const names=(b.entries||[]).map(e=>e.dogName||'').join(', ');
    return `<div onclick="openInv('${b.id}')" style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--cream-mid);cursor:pointer"><span style="font-size:14px">🧾</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--ink)">${esc(names)} · $${parseFloat(b.grand_total).toFixed(2)}</div><div style="font-size:11px;color:var(--ink-faint)">${new Date(b.saved_at||b.checkout).toLocaleDateString('en-US',{month:'short',day:'numeric'})} · invoiced</div></div></div>`;
  }).join(''):'<div style="font-size:12px;color:var(--ink-faint);padding:10px 0">No recent activity</div>';
  document.getElementById('dash-lower').innerHTML=
    `<div class="card" style="margin:0"><div class="ct" style="color:var(--danger)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>Vaccination Watch</div>${vaccHtml}</div>`+
    `<div class="card" style="margin:0"><div class="ct"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>Recent Activity</div>${actHtml}</div>`;
  
  // Render three features
  if(typeof renderCurrentlyBoarding === 'function') renderCurrentlyBoarding();
  if(typeof renderDayNavigation === 'function') renderDayNavigation();
  if(typeof renderTrends === 'function') renderTrends();
}

/* ── Right panel ──────────────────────────────────────────── */
function renderRightPanel() {
  const now = new Date();
  const tod = d => { const x=new Date(d); return x.getFullYear()===now.getFullYear()&&x.getMonth()===now.getMonth()&&x.getDate()===now.getDate(); };
  const soon = d => { const x=new Date(d); const diff=(x-now)/86400000; return diff>0&&diff<=3; };

  const active   = requests.filter(r=>r.status==='checked_in');
  const cinsToday  = requests.filter(r=>r.status==='confirmed'&&tod(r.checkin));
  const coutsToday = requests.filter(r=>r.status==='checked_in'&&tod(r.checkout));
  const upcoming   = requests.filter(r=>r.status==='confirmed'&&!tod(r.checkin)&&soon(r.checkin));

  // Stats
  const pending = requests.filter(r=>r.status==='pending').length;
  document.getElementById('rp-stats').innerHTML =
    `<div class="rp-stat"><div class="rp-stat-num">${active.length}</div><div class="rp-stat-lbl">In stay</div></div>`+
    `<div class="rp-stat"><div class="rp-stat-num">${pending}</div><div class="rp-stat-lbl">Pending</div></div>`+
    `<div class="rp-stat"><div class="rp-stat-num">${cinsToday.length}</div><div class="rp-stat-lbl">Arriving</div></div>`+
    `<div class="rp-stat"><div class="rp-stat-num">${coutsToday.length}</div><div class="rp-stat-lbl">Departing</div></div>`;

  // Check-ins today
  const cinEl = document.getElementById('rp-checkins');
  cinEl.innerHTML = cinsToday.length
    ? cinsToday.map(r=>`<div class="rp-item" onclick="goPage('calendar')"><span class="rp-item-dot in"></span>${esc(r.dog_name||r.owner_name)}</div>`).join('')
    : '<div class="rp-empty">None today</div>';

  // Check-outs today
  const coutEl = document.getElementById('rp-checkouts');
  coutEl.innerHTML = coutsToday.length
    ? coutsToday.map(r=>`<div class="rp-item" onclick="goPage('calendar')"><span class="rp-item-dot out"></span>${esc(r.dog_name||r.owner_name)}</div>`).join('')
    : '<div class="rp-empty">None today</div>';

  // Arriving soon (next 3 days)
  const upEl = document.getElementById('rp-upcoming');
  upEl.innerHTML = upcoming.length
    ? upcoming.map(r=>{
        const d=new Date(r.checkin);
        const label=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
        return `<div class="rp-item" onclick="goPage('calendar')"><span class="rp-item-dot soon"></span><span style="flex:1">${esc(r.dog_name||r.owner_name)}</span><span style="font-size:10px;color:var(--ink-faint)">${label}</span></div>`;
      }).join('')
    : '<div class="rp-empty">Nothing in next 3 days</div>';
}
/* ═══════════════════════════════════════
   THREE WORKING FEATURES
═══════════════════════════════════════ */

// FEATURE 1: Currently Boarding Dogs

/* ═══════════════════════════════════════
   DASHBOARD: Currently Boarding + Quick Check-in + Day Navigation
═══════════════════════════════════════ */

// Currently Boarding — only dogs whose status is checked_in right now
function renderCurrentlyBoarding(){
  const cb = document.getElementById('dash-currently-boarding');
  if(!cb) return;
  const now = new Date();

  const current = (typeof requests!=='undefined'?requests:[]).filter(r => {
    if(r.status !== 'checked_in') return false;
    const co = new Date(r.checkout);
    return co >= now || isNaN(co);  // still here if checkout in future (or unknown)
  }).sort((a,b)=> new Date(a.actual_checkin||a.checkin) - new Date(b.actual_checkin||b.checkin));

  if(current.length === 0){
    cb.innerHTML = '<div class="card"><div class="ct">🏠 Currently Boarding</div><div class="es"><span class="ei">🏠</span><p>No dogs currently boarding</p></div></div>';
    return;
  }

  let html = '<div class="card"><div class="ct">🏠 Currently Boarding</div>';
  current.forEach(r => {
    const co = new Date(r.checkout);
    const coStr = isNaN(co) ? 'open' : (co.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' at ' + co.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}));
    html += '<div style="display:flex;align-items:center;gap:11px;padding:11px;background:var(--cream-mid);border-radius:8px;margin-bottom:8px">'
      + '<div style="font-size:18px">' + (r.service==='boarding'?'🏡':'☀️') + '</div>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:13px;font-weight:600">' + esc(r.dog_name||'') + '</div>'
      + '<div style="font-size:11px;color:var(--ink-faint)">Checks out ' + coStr + '</div>'
      + '</div>'
      + '<button class="btn btn-g sm" style="font-size:11px" onclick="openCheckOut(\'' + r.id + '\')">Check Out</button>'
      + '</div>';
  });
  html += '</div>';
  cb.innerHTML = html;
}

// Quick Check-in — real status transition for a confirmed/pending reservation
async function quickCheckIn(requestId){
  const req = (typeof requests!=='undefined'?requests:[]).find(r => r.id === requestId);
  if(!req){ toast('Reservation not found.', true); return; }
  if(req.status === 'checked_in'){ toast(req.dog_name+' is already checked in.'); return; }
  if(req.status === 'completed'){ toast(req.dog_name+' is already checked out.', true); return; }
  if(!confirm('Check in '+req.dog_name+' now?')) return;

  const now = new Date().toISOString();
  setSyncState('busy');
  try{
    await dbUpdReq(req.id, {status:'checked_in', actual_checkin: now});
    req.status = 'checked_in';
    req.actual_checkin = now;
    setSyncState('ok');
    toast('✓ '+req.dog_name+' checked in.');
    if(typeof updateBadges==='function') updateBadges();
    if(typeof renderDashboard==='function') renderDashboard();
  }catch(e){
    setSyncState('err');
    toast('Error: '+e.message, true);
  }
}

// Undo a mistaken checkout — revert completed → checked_in, remove the premature invoice/booking,
// but keep the reservation's check-in data intact.
async function undoCheckout(requestId){
  const req = (typeof requests!=='undefined'?requests:[]).find(r => r.id === requestId);
  if(!req){ toast('Reservation not found.', true); return; }
  if(req.status !== 'completed'){ toast('This reservation is not checked out.', true); return; }
  if(!confirm('Undo checkout for '+req.dog_name+'?\n\nThis reverts them to "checked in" and removes the invoice that checkout generated. Their check-in details are kept.')) return;

  setSyncState('busy');
  try{
    const bookingId = req.booking_id;
    // Remove the premature booking/invoice if one was created
    if(bookingId){
      try { await dbDeleteBooking(bookingId); } catch(delErr){ console.warn('Booking delete failed (continuing):', delErr); }
      if(typeof bookings!=='undefined') bookings = bookings.filter(b=> b.id !== bookingId);
    }
    // Revert reservation status; keep actual_checkin, clear checkout-side fields
    await dbUpdReq(req.id, {status:'checked_in', actual_checkout:null, final_total:null, booking_id:null});
    req.status = 'checked_in';
    req.actual_checkout = null;
    req.final_total = null;
    req.booking_id = null;
    setSyncState('ok');
    toast('✓ Checkout undone — '+req.dog_name+' is boarding again.');
    if(typeof updateBadges==='function') updateBadges();
    if(typeof renderDashboard==='function') renderDashboard();
    if(typeof renderRequests==='function') renderRequests();
  }catch(e){
    setSyncState('err');
    toast('Error: '+e.message, true);
  }
}

// Day Navigation — shows arrivals, departures, and dogs whose stay overlaps the day
let browseDate = new Date();

function renderDayNavigation(){
  const navDiv = document.getElementById('dash-day-nav');
  if(!navDiv) return;

  const dayStart = new Date(browseDate); dayStart.setHours(0,0,0,0);
  const dayEnd   = new Date(browseDate); dayEnd.setHours(23,59,59,999);

  const list = (typeof requests!=='undefined'?requests:[]).filter(r => {
    if(r.status === 'declined') return false;
    const ci = new Date(r.actual_checkin || r.checkin);
    const co = new Date(r.actual_checkout || r.checkout);
    if(isNaN(ci)) return false;
    return (ci <= dayEnd && (isNaN(co) ? true : co >= dayStart)); // overlaps the day
  }).sort((a,b)=> new Date(a.actual_checkin||a.checkin) - new Date(b.actual_checkin||b.checkin));

  const dateStr = browseDate.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const isToday = browseDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

  let html = '<div class="card"><div class="ct" style="display:flex;justify-content:space-between;align-items:center">'
    + '<span>📅 ' + dateStr + (isToday?' (Today)':'') + '</span>'
    + '<div style="display:flex;gap:6px">'
    + '<button class="btn btn-o sm" style="padding:6px 12px" onclick="prevDay()">←</button>'
    + '<button class="btn btn-o sm" style="padding:6px 12px" onclick="todayDay()">Today</button>'
    + '<button class="btn btn-o sm" style="padding:6px 12px" onclick="nextDay()">→</button>'
    + '</div></div>';

  if(list.length === 0){
    html += '<div style="padding:14px;text-align:center;color:var(--ink-faint)">No dogs for this day</div>';
  } else {
    list.forEach(r => {
      const ci = new Date(r.actual_checkin || r.checkin);
      const ciTime = ci.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
      let label, color;
      if(r.status === 'checked_in'){ label = 'Currently boarding · since ' + ciTime; color = 'var(--forest)'; }
      else if(r.status === 'completed'){ label = 'Checked out'; color = 'var(--ink-faint)'; }
      else if(r.status === 'confirmed'){ label = 'Arriving ' + ciTime; color = 'var(--bluep-text,var(--ink-mid))'; }
      else { label = 'Requested · ' + ciTime; color = 'var(--ink-faint)'; }

      html += '<div style="padding:11px;border-bottom:1px solid var(--cream-mid);display:flex;align-items:center;gap:10px">'
        + '<div style="font-size:16px">' + (r.service==='boarding'?'🏡':'☀️') + '</div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-weight:600;font-size:13px">' + esc(r.dog_name||'') + '</div>'
        + '<div style="font-size:11px;color:'+color+'">' + label + '</div>'
        + '</div>';
      if(r.status === 'confirmed' || r.status === 'pending'){
        html += '<button class="btn btn-b sm" style="font-size:11px" onclick="quickCheckIn(\''+r.id+'\')">Check In</button>';
      } else if(r.status === 'checked_in'){
        html += '<button class="btn btn-g sm" style="font-size:11px" onclick="openCheckOut(\''+r.id+'\')">Check Out</button>';
      } else {
        html += '<button class="btn btn-o sm" style="font-size:11px" onclick="goPage(\'requests\')">View</button>';
      }
      html += '</div>';
    });
  }

  html += '</div>';
  navDiv.innerHTML = html;
}

function prevDay(){ browseDate.setDate(browseDate.getDate()-1); renderDayNavigation(); }
function nextDay(){ browseDate.setDate(browseDate.getDate()+1); renderDayNavigation(); }
function todayDay(){ browseDate = new Date(); renderDayNavigation(); }

/* ═══════════════════════════════════════
   DASHBOARD: Trend perspectives (switchable)
═══════════════════════════════════════ */
let trendView = null;

// Catalog of all available trends. enable/disable is stored in settings.trendsEnabled
const TREND_CATALOG = [
  ['revenue',   'Revenue mix',        'Boarding vs day care revenue split'],
  ['occupancy', 'Occupancy',          '% of capacity booked over next 14 days'],
  ['volume',    'Monthly volume',     'Completed visits per month'],
  ['breeds',    'Breeds & regulars',  'Top breeds and repeat customers'],
  ['los',       'Length of stay',     'Average nights per boarding stay'],
  ['revpak',    'Revenue / kennel',   'Avg revenue per available kennel-night'],
  ['retention', 'New vs returning',   'Share of stays from returning customers'],
  ['dow',       'Day-of-week demand', 'Which weekdays are busiest']
];

function trendEnabled(key){
  const t = (typeof settings!=='undefined' && settings.trendsEnabled) ? settings.trendsEnabled : null;
  if(!t) return true; // default: all on until the owner customizes
  return t[key] !== false;
}

function enabledTrends(){ return TREND_CATALOG.filter(t=>trendEnabled(t[0])); }

function setTrendView(v){ trendView = v; renderTrends(); }

function renderTrends(){
  const host = document.getElementById('dash-trends');
  if(!host) return;

  const avail = enabledTrends();
  if(!avail.length){ host.innerHTML=''; return; } // all disabled -> hide section

  // default selection / repair if current selection got disabled
  if(!trendView || !avail.some(t=>t[0]===trendView)) trendView = avail[0][0];

  let html = '<div class="card"><div class="ct">📊 Trends</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">';
  avail.forEach(([key,label])=>{
    const on = trendView===key;
    html += '<button class="btn '+(on?'btn-p':'btn-o')+' sm" style="font-size:11px" onclick="setTrendView(\''+key+'\')">'+esc(label)+'</button>';
  });
  html += '</div>';
  html += '<div>'+trendBody()+'</div>';
  html += '</div>';
  host.innerHTML = html;
}

function trendBar(label, value, max, valueLabel, color){
  const pct = max>0 ? Math.round((value/max)*100) : 0;
  color = color || 'var(--brown)';
  return '<div style="margin-bottom:10px">'
    + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">'
    + '<span style="color:var(--ink)">'+esc(label)+'</span>'
    + '<span style="color:var(--ink-faint);font-weight:600">'+esc(valueLabel)+'</span>'
    + '</div>'
    + '<div style="height:8px;background:var(--cream-mid);border-radius:5px;overflow:hidden">'
    + '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:5px"></div>'
    + '</div></div>';
}

function trendStat(big, sub){
  return '<div style="text-align:center;padding:14px 0"><div style="font-family:\'DM Serif Display\',serif;font-size:34px;color:var(--ink);line-height:1.1">'+esc(big)+'</div><div style="font-size:12px;color:var(--ink-faint);margin-top:4px">'+esc(sub)+'</div></div>';
}

function trendBody(){
  const bk = (typeof bookings!=='undefined'?bookings:[]);
  const rq = (typeof requests!=='undefined'?requests:[]);
  const dg = (typeof dogs!=='undefined'?dogs:[]);
  const empty = '<div style="padding:10px 0;color:var(--ink-faint);font-size:13px">Not enough data yet.</div>';

  if(trendView==='revenue'){
    let boardRev=0, dayRev=0;
    bk.forEach(b=>{ const amt=parseFloat(b.grand_total)||0; if(b.service==='daycare') dayRev+=amt; else boardRev+=amt; });
    const total=boardRev+dayRev;
    if(total<=0) return empty;
    const max=Math.max(boardRev,dayRev);
    return trendBar('🏡 Boarding', boardRev, max, '$'+boardRev.toFixed(0)+' · '+Math.round(boardRev/total*100)+'%', 'var(--brown)')
      + trendBar('☀️ Day Care', dayRev, max, '$'+dayRev.toFixed(0)+' · '+Math.round(dayRev/total*100)+'%', 'var(--gold)')
      + '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--cream-mid);display:flex;justify-content:space-between;font-size:13px"><span style="font-weight:600">Total billed</span><span style="font-weight:700">$'+total.toFixed(0)+'</span></div>';
  }

  if(trendView==='occupancy'){
    const cap = (typeof settings!=='undefined' && settings.capacity) ? settings.capacity : 12;
    const today=new Date(); today.setHours(0,0,0,0);
    let rows=''; let any=false;
    for(let i=0;i<14;i++){
      const day=new Date(today); day.setDate(day.getDate()+i);
      const dayStart=new Date(day); dayStart.setHours(0,0,0,0);
      const dayEnd=new Date(day); dayEnd.setHours(23,59,59,999);
      let count=0;
      rq.forEach(r=>{
        if(r.status==='declined'||r.status==='completed'||r.status==='pending') return;
        const ci=new Date(r.actual_checkin||r.checkin), co=new Date(r.checkout);
        if(!isNaN(ci) && ci<=dayEnd && (isNaN(co)?true:co>=dayStart)){ count+= (r.dog_ids&&r.dog_ids.length)?r.dog_ids.length:1; }
      });
      if(count>0) any=true;
      const lbl = i===0 ? 'Today' : day.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
      const pctNum = Math.round((count/cap)*100);
      const color = pctNum>=90 ? 'var(--danger)' : pctNum>=70 ? 'var(--gold)' : 'var(--forest)';
      rows += trendBar(lbl, count, cap, count+'/'+cap+' · '+pctNum+'%', color);
    }
    if(!any) return '<div style="padding:10px 0;color:var(--ink-faint);font-size:13px">No confirmed stays in the next 14 days.</div>';
    return '<div style="font-size:11px;color:var(--ink-faint);margin-bottom:10px">Capacity '+cap+' spaces · next 14 days</div>'+rows;
  }

  if(trendView==='volume'){
    const months={};
    bk.forEach(b=>{ const d=new Date(b.saved_at||b.checkin); if(isNaN(d)) return; const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); months[key]=(months[key]||0)+1; });
    const keys=Object.keys(months).sort().slice(-6);
    if(!keys.length) return empty;
    const max=Math.max.apply(null,keys.map(k=>months[k]));
    return keys.map(k=>{
      const parts=k.split('-');
      const lbl=new Date(+parts[0],+parts[1]-1,1).toLocaleDateString('en-US',{month:'short',year:'2-digit'});
      return trendBar(lbl, months[k], max, months[k]+' visit'+(months[k]!==1?'s':''), 'var(--brown)');
    }).join('');
  }

  if(trendView==='breeds'){
    const breeds={};
    dg.forEach(d=>{ const b=(d.breed||'').trim()||'Unknown'; breeds[b]=(breeds[b]||0)+1; });
    const topBreeds=Object.entries(breeds).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const ownerCounts={};
    bk.forEach(b=>{ (b.entries||[]).forEach(e=>{ const o=(e.ownerName||'').trim(); if(o) ownerCounts[o]=(ownerCounts[o]||0)+1; }); });
    const repeats=Object.entries(ownerCounts).filter(e=>e[1]>1).sort((a,b)=>b[1]-a[1]).slice(0,5);
    if(!topBreeds.length && !repeats.length) return empty;
    let out='';
    if(topBreeds.length){
      const max=topBreeds[0][1];
      out += '<div style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Top breeds</div>';
      out += topBreeds.map(e=>trendBar(e[0], e[1], max, e[1]+' dog'+(e[1]!==1?'s':''), 'var(--brown)')).join('');
    }
    if(repeats.length){
      const max=repeats[0][1];
      out += '<div style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px">Repeat customers</div>';
      out += repeats.map(e=>trendBar(e[0], e[1], max, e[1]+' stays', 'var(--gold)')).join('');
    } else {
      out += '<div style="margin-top:12px;font-size:12px;color:var(--ink-faint)">No repeat customers yet.</div>';
    }
    return out;
  }

  if(trendView==='los'){
    // Average length of stay (nights) for boarding bookings
    let totalNights=0, n=0;
    bk.forEach(b=>{ if(b.service==='daycare') return; const ci=new Date(b.checkin), co=new Date(b.checkout); if(isNaN(ci)||isNaN(co)) return; const nights=Math.max(1,Math.round((co-ci)/86400000)); totalNights+=nights; n++; });
    if(!n) return empty;
    const avg=(totalNights/n).toFixed(1);
    return trendStat(avg+' nights', 'Average boarding stay · across '+n+' completed stay'+(n!==1?'s':''));
  }

  if(trendView==='revpak'){
    // Revenue per available kennel-night (RevPAK): total boarding revenue / (capacity * days in window)
    const cap = (typeof settings!=='undefined' && settings.capacity) ? settings.capacity : 12;
    let rev=0, minD=null, maxD=null;
    bk.forEach(b=>{ const amt=parseFloat(b.grand_total)||0; rev+=amt; const d=new Date(b.saved_at||b.checkin); if(!isNaN(d)){ if(!minD||d<minD)minD=d; if(!maxD||d>maxD)maxD=d; } });
    if(rev<=0||!minD) return empty;
    const days=Math.max(1,Math.round((maxD-minD)/86400000)+1);
    const revpak=rev/(cap*days);
    return trendStat('$'+revpak.toFixed(2), 'Per kennel-night available · '+cap+' kennels over '+days+' day'+(days!==1?'s':''))
      + '<div style="font-size:11px;color:var(--ink-faint);text-align:center;margin-top:-6px">Higher = better use of capacity</div>';
  }

  if(trendView==='retention'){
    // New vs returning: for each booking entry, was that owner seen in an earlier booking?
    const seen={}; let nw=0, ret=0;
    const ordered=bk.slice().sort((a,b)=>new Date(a.saved_at||a.checkin)-new Date(b.saved_at||b.checkin));
    ordered.forEach(b=>{ (b.entries||[]).forEach(e=>{ const o=(e.ownerName||'').trim().toLowerCase(); if(!o) return; if(seen[o]) ret++; else { nw++; seen[o]=true; } }); });
    const total=nw+ret;
    if(!total) return empty;
    const max=Math.max(nw,ret);
    return trendBar('🆕 New customers', nw, max, nw+' · '+Math.round(nw/total*100)+'%', 'var(--forest)')
      + trendBar('🔁 Returning', ret, max, ret+' · '+Math.round(ret/total*100)+'%', 'var(--gold)')
      + '<div style="font-size:11px;color:var(--ink-faint);text-align:center;margin-top:6px">Higher returning share = stronger loyalty</div>';
  }

  if(trendView==='dow'){
    // Day-of-week demand: count check-ins by weekday
    const dows=[0,0,0,0,0,0,0]; const names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    bk.forEach(b=>{ const d=new Date(b.checkin); if(!isNaN(d)) dows[d.getDay()]++; });
    rq.filter(r=>r.status==='confirmed'||r.status==='checked_in').forEach(r=>{ const d=new Date(r.actual_checkin||r.checkin); if(!isNaN(d)) dows[d.getDay()]++; });
    const total=dows.reduce((a,b)=>a+b,0);
    if(!total) return empty;
    const max=Math.max.apply(null,dows);
    // Reorder Mon..Sun for readability
    const order=[1,2,3,4,5,6,0];
    return order.map(i=>trendBar(names[i], dows[i], max, String(dows[i]), i===0||i===6?'var(--gold)':'var(--brown)')).join('');
  }

  return empty;
}

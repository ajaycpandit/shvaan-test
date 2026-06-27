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
    return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--cream-mid)"><div class="dd-ava" style="width:30px;height:30px;font-size:14px">${dog&&dog.photo?`<img src="${dog.photo}" alt="">`:'🐶'}</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">${esc(r.dog_name)}${overdueTag}</div><div style="font-size:11px;color:var(--ink-faint)">${new Date(r.checkout).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div></div><button class="btn btn-g sm" onclick="quickCheckOut('${r.id}')">Check Out</button></div>`;
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
  if(typeof renderWeekAvail === 'function') renderWeekAvail();
  if(typeof renderDayNavigation === 'function') renderDayNavigation();
  if(typeof renderTrends === 'function') renderTrends();
  if(typeof renderOutlook === 'function') renderOutlook();
  if(typeof renderPhotoReminder === 'function') renderPhotoReminder();
}

/* ── Week availability strip ──────────────────────────────────
   Shows a 7-day week with spaces available per day; scroll weeks. */
let weekAvailStart = null; // Monday of the displayed week
function _mondayOf(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function _dsOf(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function renderWeekAvail(){
  const host = document.getElementById('dash-week-avail');
  if(!host) return;
  if(!weekAvailStart) weekAvailStart = _mondayOf(new Date());
  const cap = (typeof settings!=='undefined' && settings.capacity) ? settings.capacity : 12;
  const todayDs = _dsOf(new Date());
  const days = [];
  for(let i=0;i<7;i++){ const d=new Date(weekAvailStart); d.setDate(d.getDate()+i); days.push(d); }
  const occFn = (typeof dayOccupancy==='function') ? dayOccupancy : null;

  const weekEnd = new Date(weekAvailStart); weekEnd.setDate(weekEnd.getDate()+6);
  const rangeLabel = weekAvailStart.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' – ' +
    weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

  let cells = days.map(function(d){
    const ds=_dsOf(d);
    const occ = occFn ? occFn(ds) : 0;
    const avail = Math.max(0, cap-occ);
    const isToday = ds===todayDs;
    // Color strictly by spaces available:
    //   0 left  → red (Full)
    //   1 left  → amber (almost full)
    //   2+ left → green (Open)
    let bg='var(--cream)', bar='var(--forest)', availColor='var(--forest)';
    if(avail<=0){ bg='rgba(193,79,63,0.12)'; bar='var(--danger)'; availColor='var(--danger)'; }
    else if(avail===1){ bg='rgba(217,164,65,0.16)'; bar='var(--gold)'; availColor='var(--brown-dark)'; }
    else { bg='var(--cream)'; bar='var(--forest)'; availColor='var(--forest)'; }
    const dow = d.toLocaleDateString('en-US',{weekday:'short'});
    const dnum = d.getDate();
    return '<div onclick="openDayMo(\''+ds+'\')" style="flex:1 1 0;min-width:54px;cursor:pointer;position:relative;background:'+bg+';border:1px solid '+(isToday?'var(--brown)':'var(--cream-dark)')+';border-radius:var(--r2);padding:9px 4px 8px;text-align:center;overflow:hidden;scroll-snap-align:start">'
      + '<div style="position:absolute;top:0;left:0;width:100%;height:3px;background:'+bar+'"></div>'
      + '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-faint)">'+dow+'</div>'
      + '<div style="font-size:15px;font-weight:700;color:'+(isToday?'var(--brown-dark)':'var(--ink-mid)')+';margin:1px 0 4px">'+dnum+'</div>'
      + '<div style="font-size:17px;font-family:\'DM Serif Display\',serif;line-height:1;color:'+availColor+'">'+avail+'</div>'
      + '<div style="font-size:9px;color:var(--ink-faint);margin-top:1px">'+(avail===1?'space':'spaces')+'</div>'
      + '</div>';
  }).join('');

  host.innerHTML = '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px">'
    + '<div class="ct" style="margin:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Availability this week</div>'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + '<button class="btn btn-o sm" style="font-size:11px;padding:5px 10px" onclick="openUpcoming()">📋 Upcoming stays</button>'
    + '<button class="btn btn-o sm" style="font-size:11px;padding:5px 9px" onclick="weekAvailPrev()">‹</button>'
    + '<button class="btn btn-o sm" style="font-size:11px;padding:5px 10px" onclick="weekAvailToday()">This week</button>'
    + '<button class="btn btn-o sm" style="font-size:11px;padding:5px 9px" onclick="weekAvailNext()">›</button>'
    + '</div></div>'
    + '<div style="font-size:12px;color:var(--ink-faint);margin-bottom:10px">'+esc(rangeLabel)+' · capacity '+cap+'</div>'
    + '<div style="display:flex;gap:6px;width:100%">'+cells+'</div>'
    + '<div style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--ink-faint)">'
    + '<span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:var(--forest)"></span>Open</span>'
    + '<span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:var(--gold)"></span>1 left</span>'
    + '<span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:var(--danger)"></span>Full</span>'
    + '</div></div>';
}
function weekAvailPrev(){ weekAvailStart = weekAvailStart || _mondayOf(new Date()); weekAvailStart.setDate(weekAvailStart.getDate()-7); renderWeekAvail(); }
function weekAvailNext(){ weekAvailStart = weekAvailStart || _mondayOf(new Date()); weekAvailStart.setDate(weekAvailStart.getDate()+7); renderWeekAvail(); }
function weekAvailToday(){ weekAvailStart = _mondayOf(new Date()); renderWeekAvail(); }

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
      + '<button class="btn btn-g sm" style="font-size:11px" onclick="quickCheckOut(\'' + r.id + '\')">Check Out</button>'
      + '</div>';
  });
  html += '</div>';
  cb.innerHTML = html;
}

// Quick Check-out — one-click checkout at the current time, no discount.
// Mirrors quickCheckIn but also bills: calculates the final total and generates an invoice.
async function quickCheckOut(requestId){
  const r = (typeof requests!=='undefined'?requests:[]).find(x => x.id === requestId);
  if(!r){ toast('Reservation not found.', true); return; }
  if(r.status === 'completed'){ toast(r.dog_name+' is already checked out.', true); return; }
  if(r.status !== 'checked_in'){ toast('Please check '+r.dog_name+' in before checking out.', true); return; }

  const now = new Date();
  const inDt = new Date(r.actual_checkin || r.checkin);
  if(isNaN(inDt)){ toast('No valid check-in time on file. Use the full Check Out to set it.', true); return; }
  if(now <= inDt){ toast('Check-out must be after check-in. Use the full Check Out to adjust.', true); return; }

  // Calculate the bill exactly like saveCio (current time, no discount)
  const ctxs = reqDogContexts(r);
  const results = ctxs.map(dg => ({dog:dg, ...calcDogSvc(dg, inDt, now, r.service)}));
  const subtotal = results.reduce((s,x)=> s + x.total, 0);

  // One-tap: no confirmation prompt. Checkout is reversible via "Undo Checkout".
  setSyncState('busy');
  try{
    const entries = results.map(x => ({
      dogId:x.dog?x.dog.id:null, dogName:x.dog?x.dog.dog_name:'', ownerName:x.dog?x.dog.owner_name:r.owner_name,
      phone:x.dog?x.dog.phone:'', photo:x.dog?x.dog.photo:null, notes:x.dog?x.dog.notes:'',
      rate:x.rate, fullDays:x.fullDays, extraHrs:x.extraHrs, surcharge:x.surcharge, total:x.total, subtotal:x.total, discount:0
    }));
    if(entries[0]){ entries[0].requested_checkin=r.checkin; entries[0].requested_checkout=r.checkout; entries[0].discount_type='pct'; entries[0].discount_val=0; }
    const booking = { id:Date.now().toString(), saved_at:new Date().toISOString(), service:r.service, checkin:inDt.toISOString(), checkout:now.toISOString(), grand_total:subtotal, requested_checkin:r.checkin, requested_checkout:r.checkout, entries:entries };

    try { await dbInsertBooking(booking); }
    catch(insErr){ setSyncState('err'); toast('Could not save booking: '+insErr.message, true); return; }

    const fullPayload = {status:'completed', actual_checkin:inDt.toISOString(), actual_checkout:now.toISOString(), final_total:subtotal, booking_id:booking.id};
    try {
      await dbUpdReq(r.id, fullPayload);
    } catch(updErr){
      try { await dbUpdReq(r.id, {status:'completed'}); toast('Checked out, but some details could not be saved to the reservation. The invoice is saved.', true); }
      catch(statusErr){
        try { await dbDeleteBooking(booking.id); } catch(_){}
        if(typeof bookings!=='undefined') bookings = bookings.filter(b=>b.id!==booking.id);
        setSyncState('err'); toast('Checkout could not be saved: '+statusErr.message+'. Nothing changed — please try again.', true); return;
      }
    }
    if(typeof bookings!=='undefined') bookings.unshift(booking);
    r.status='completed'; r.actual_checkin=inDt.toISOString(); r.actual_checkout=now.toISOString(); r.final_total=subtotal; r.booking_id=booking.id;
    setSyncState('ok');
    toast('✓ '+r.dog_name+' checked out · $'+subtotal.toFixed(2));
    if(typeof updateBadges==='function') updateBadges();
    if(typeof renderDashboard==='function') renderDashboard();
    if(typeof renderRequests==='function') renderRequests();
    try { openInv(booking.id); } catch(invErr){ console.warn('Invoice open failed:', invErr); }
  }catch(e){
    setSyncState('err'); toast('Error: '+e.message, true);
  }
}

// Quick Check-in — real status transition for a confirmed/pending reservation
async function quickCheckIn(requestId){
  const req = (typeof requests!=='undefined'?requests:[]).find(r => r.id === requestId);
  if(!req){ toast('Reservation not found.', true); return; }
  if(req.status === 'pending'){ toast('Please confirm this reservation before checking in.', true); return; }
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

// Undo a mistaken check-in — revert checked_in → confirmed, clear the check-in timestamp.
async function undoCheckIn(requestId){
  const req = (typeof requests!=='undefined'?requests:[]).find(r => r.id === requestId);
  if(!req){ toast('Reservation not found.', true); return; }
  if(req.status !== 'checked_in'){ toast('This reservation is not checked in.', true); return; }
  if(!confirm('Undo check-in for '+req.dog_name+'?\n\nThis sends the reservation back to "confirmed" and clears the recorded check-in time.')) return;

  setSyncState('busy');
  try{
    await dbUpdReq(req.id, {status:'confirmed', actual_checkin:null});
    req.status = 'confirmed';
    req.actual_checkin = null;
    setSyncState('ok');
    toast('✓ Check-in undone — '+req.dog_name+' is back to confirmed.');
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
    const todayKey = new Date().toISOString().split('T')[0];
    const fmtWhen = (dt) => {
      if(isNaN(dt)) return '';
      const t = dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
      const key = dt.toISOString().split('T')[0];
      const dateLabel = key===todayKey ? 'Today' : dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      return dateLabel + ' · ' + t;
    };
    list.forEach(r => {
      const ci = new Date(r.actual_checkin || r.checkin);
      const co = new Date(r.actual_checkout || r.checkout);
      let label, color;
      if(r.status === 'checked_in'){ label = 'Boarding since ' + fmtWhen(ci); color = 'var(--forest)'; }
      else if(r.status === 'completed'){
        label = 'Checked out ' + (isNaN(co) ? '' : fmtWhen(co)); color = 'var(--ink-faint)';
      }
      else if(r.status === 'confirmed'){ label = 'Arriving ' + fmtWhen(ci); color = 'var(--bluep-text,var(--ink-mid))'; }
      else { label = 'Requested · ' + fmtWhen(ci); color = 'var(--ink-faint)'; }

      html += '<div style="padding:11px;border-bottom:1px solid var(--cream-mid);display:flex;align-items:center;gap:10px">'
        + '<div style="font-size:16px">' + (r.service==='boarding'?'🏡':'☀️') + '</div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-weight:600;font-size:13px">' + esc(r.dog_name||'') + '</div>'
        + '<div style="font-size:11px;color:'+color+'">' + label + '</div>'
        + '</div>';
      if(r.status === 'confirmed'){
        html += '<button class="btn btn-b sm" style="font-size:11px" onclick="quickCheckIn(\''+r.id+'\')">Check In</button>';
      } else if(r.status === 'pending'){
        html += '<button class="btn btn-o sm" style="font-size:11px" onclick="goPage(\'requests\')">Confirm first</button>';
      } else if(r.status === 'checked_in'){
        html += '<button class="btn btn-g sm" style="font-size:11px" onclick="quickCheckOut(\''+r.id+'\')">Check Out</button>';
      } else if(r.status === 'completed'){
        const click = r.booking_id ? ' style="cursor:pointer" onclick="openInv(\''+r.booking_id+'\')" title="View invoice"' : '';
        html += '<span class="bdg"'+click+' style="background:var(--cream-mid);color:var(--ink-faint);font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;white-space:nowrap'+(r.booking_id?';cursor:pointer':'')+'">✓ Checked out</span>';
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
let trendFormat = 'bar';  // 'bar' | 'line' | 'donut'

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

// Which formats make sense per trend. 'stat' trends show a single number (no chart choice).
const TREND_FORMATS = {
  revenue:   ['bar','donut'],
  occupancy: ['bar','line'],
  volume:    ['bar','line'],
  breeds:    ['bar'],            // two grouped lists; bars only
  los:       ['stat'],
  revpak:    ['stat'],
  retention: ['bar','donut'],
  dow:       ['bar','line']
};

function trendEnabled(key){
  const t = (typeof settings!=='undefined' && settings.trendsEnabled) ? settings.trendsEnabled : null;
  if(!t) return true;
  return t[key] !== false;
}
function enabledTrends(){ return TREND_CATALOG.filter(t=>trendEnabled(t[0])); }

function setTrendView(v){
  trendView = v;
  // reset format to first valid one for this trend
  const fmts = TREND_FORMATS[v] || ['bar'];
  if(fmts.indexOf(trendFormat)===-1) trendFormat = fmts[0];
  renderTrends();
}
function setTrendFormat(f){ trendFormat = f; renderTrends(); }

function renderTrends(){
  const host = document.getElementById('dash-trends');
  if(!host) return;
  const avail = enabledTrends();
  if(!avail.length){ host.innerHTML=''; return; }
  if(!trendView || !avail.some(t=>t[0]===trendView)){ trendView = avail[0][0]; trendFormat = (TREND_FORMATS[trendView]||['bar'])[0]; }

  let html = '<div class="card"><div class="ct">📊 Trends</div>';
  // trend selector
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
  avail.forEach(function(t){
    const key=t[0], label=t[1], on = trendView===key;
    html += '<button class="btn '+(on?'btn-p':'btn-o')+' sm" style="font-size:11px" onclick="setTrendView(\''+key+'\')">'+esc(label)+'</button>';
  });
  html += '</div>';

  // format selector (only when >1 format available)
  const fmts = TREND_FORMATS[trendView] || ['bar'];
  if(fmts.length>1 && fmts.indexOf('stat')===-1){
    const fmtLabel={bar:'▭ Bars',line:'📈 Line',donut:'◓ Donut'};
    html += '<div style="display:flex;gap:6px;margin-bottom:14px">';
    fmts.forEach(function(f){
      const on = trendFormat===f;
      html += '<button class="btn '+(on?'btn-p':'btn-o')+' sm" style="font-size:10px;padding:4px 9px" onclick="setTrendFormat(\''+f+'\')">'+fmtLabel[f]+'</button>';
    });
    html += '</div>';
  }

  html += '<div>'+trendBody()+'</div>';
  html += '</div>';
  host.innerHTML = html;
}

/* ── format renderers ── */
function trendBar(label, value, max, valueLabel, color){
  const pct = max>0 ? Math.round((value/max)*100) : 0;
  color = color || 'var(--brown)';
  return '<div style="margin-bottom:10px">'
    + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">'
    + '<span style="color:var(--ink)">'+esc(label)+'</span>'
    + '<span style="color:var(--ink-faint);font-weight:600">'+esc(valueLabel)+'</span></div>'
    + '<div style="height:8px;background:var(--cream-mid);border-radius:5px;overflow:hidden">'
    + '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:5px"></div></div></div>';
}
function trendStat(big, sub){
  return '<div style="text-align:center;padding:14px 0"><div style="font-family:\'DM Serif Display\',serif;font-size:34px;color:var(--ink);line-height:1.1">'+esc(big)+'</div><div style="font-size:12px;color:var(--ink-faint);margin-top:4px">'+esc(sub)+'</div></div>';
}
// series = [{label, value, valueLabel, color}]
function renderSeries(series, unitLabel){
  if(trendFormat==='line') return trendLine(series, unitLabel);
  if(trendFormat==='donut') return trendDonut(series);
  // default bars
  const max = Math.max.apply(null, series.map(function(s){return s.value;}).concat([0]));
  return series.map(function(s){ return trendBar(s.label, s.value, max, s.valueLabel, s.color); }).join('');
}
function trendLine(series, unitLabel){
  if(series.length<2) { // not enough points for a line; fall back to bars
    const max=Math.max.apply(null,series.map(function(s){return s.value;}).concat([0]));
    return series.map(function(s){return trendBar(s.label,s.value,max,s.valueLabel,s.color);}).join('');
  }
  const W=300, H=120, padL=8, padR=8, padT=10, padB=22;
  const vals=series.map(function(s){return s.value;});
  const maxV=Math.max.apply(null,vals), minV=Math.min.apply(null,vals.concat([0]));
  const span=(maxV-minV)||1;
  const n=series.length;
  const x=function(i){ return padL + i*((W-padL-padR)/(n-1)); };
  const y=function(v){ return padT + (H-padT-padB)*(1-(v-minV)/span); };
  let pts=series.map(function(s,i){return x(i)+','+y(s.value);}).join(' ');
  // area fill path
  let area='M'+x(0)+','+(H-padB)+' L'+series.map(function(s,i){return x(i)+','+y(s.value);}).join(' L')+' L'+x(n-1)+','+(H-padB)+' Z';
  let dots=series.map(function(s,i){return '<circle cx="'+x(i)+'" cy="'+y(s.value)+'" r="3" fill="var(--brown)"/>';}).join('');
  let labels=series.map(function(s,i){
    const anchor = i===0?'start':(i===n-1?'end':'middle');
    return '<text x="'+x(i)+'" y="'+(H-6)+'" font-size="9" fill="var(--ink-faint)" text-anchor="'+anchor+'">'+esc(s.label)+'</text>';
  }).join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;overflow:visible">'
    + '<path d="'+area+'" fill="var(--brown)" opacity="0.10"/>'
    + '<polyline points="'+pts+'" fill="none" stroke="var(--brown)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    + dots + labels
    + '</svg>'
    + '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-faint);margin-top:6px"><span>'+esc(series[0].valueLabel)+'</span><span>'+esc(series[n-1].valueLabel)+'</span></div>';
}
function trendDonut(series){
  const total=series.reduce(function(a,s){return a+s.value;},0);
  if(total<=0) return '<div style="padding:10px 0;color:var(--ink-faint);font-size:13px">Not enough data yet.</div>';
  const R=52, r=32, cx=70, cy=70, C=2*Math.PI*((R+r)/2), sw=R-r;
  let acc=0, segs='';
  const palette=['var(--brown)','var(--gold)','var(--forest)','var(--coral)','#9C7BB8','#5B8DB8'];
  series.forEach(function(s,i){
    const frac=s.value/total;
    const dash=frac*C;
    const color=s.color||palette[i%palette.length];
    segs += '<circle cx="'+cx+'" cy="'+cy+'" r="'+((R+r)/2)+'" fill="none" stroke="'+color+'" stroke-width="'+sw+'" '
         + 'stroke-dasharray="'+dash+' '+(C-dash)+'" stroke-dashoffset="'+(-acc)+'" transform="rotate(-90 '+cx+' '+cy+')"/>';
    acc += dash;
  });
  let legend=series.map(function(s,i){
    const color=s.color||palette[i%palette.length];
    const pct=Math.round(s.value/total*100);
    return '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;font-size:12px"><span style="width:11px;height:11px;border-radius:3px;background:'+color+';flex:none"></span><span style="flex:1;color:var(--ink)">'+esc(s.label)+'</span><span style="color:var(--ink-faint);font-weight:600">'+esc(s.valueLabel)+'</span></div>';
  }).join('');
  return '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">'
    + '<svg viewBox="0 0 140 140" style="width:140px;height:140px;flex:none">'+segs
    + '<text x="70" y="74" font-size="15" font-weight="700" fill="var(--ink)" text-anchor="middle">'+esc(series.length+'')+'</text>'
    + '<text x="70" y="90" font-size="9" fill="var(--ink-faint)" text-anchor="middle">segments</text></svg>'
    + '<div style="flex:1;min-width:140px">'+legend+'</div></div>';
}

/* ── trend data + bodies ── */
function trendBody(){
  const bk = (typeof bookings!=='undefined'?bookings:[]);
  const rq = (typeof requests!=='undefined'?requests:[]);
  const dg = (typeof dogs!=='undefined'?dogs:[]);
  const empty = '<div style="padding:10px 0;color:var(--ink-faint);font-size:13px">Not enough data yet.</div>';

  if(trendView==='revenue'){
    let boardRev=0, dayRev=0;
    bk.forEach(function(b){ const amt=parseFloat(b.grand_total)||0; if(b.service==='daycare') dayRev+=amt; else boardRev+=amt; });
    const total=boardRev+dayRev;
    if(total<=0) return empty;
    const series=[
      {label:'🏡 Boarding', value:boardRev, valueLabel:'$'+boardRev.toFixed(0)+' · '+Math.round(boardRev/total*100)+'%', color:'var(--brown)'},
      {label:'☀️ Day Care', value:dayRev, valueLabel:'$'+dayRev.toFixed(0)+' · '+Math.round(dayRev/total*100)+'%', color:'var(--gold)'}
    ];
    let extra = trendFormat==='donut' ? '' : '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--cream-mid);display:flex;justify-content:space-between;font-size:13px"><span style="font-weight:600">Total billed</span><span style="font-weight:700">$'+total.toFixed(0)+'</span></div>';
    return renderSeries(series)+extra;
  }

  if(trendView==='occupancy'){
    const cap = (typeof settings!=='undefined' && settings.capacity) ? settings.capacity : 12;
    const today=new Date(); today.setHours(0,0,0,0);
    const series=[]; let any=false;
    for(let i=0;i<14;i++){
      const day=new Date(today); day.setDate(day.getDate()+i);
      const dayStart=new Date(day); dayStart.setHours(0,0,0,0);
      const dayEnd=new Date(day); dayEnd.setHours(23,59,59,999);
      let count=0;
      rq.forEach(function(r){
        if(r.status==='declined'||r.status==='completed'||r.status==='pending') return;
        const ci=new Date(r.actual_checkin||r.checkin), co=new Date(r.checkout);
        if(!isNaN(ci) && ci<=dayEnd && (isNaN(co)?true:co>=dayStart)){ count+= (r.dog_ids&&r.dog_ids.length)?r.dog_ids.length:1; }
      });
      if(count>0) any=true;
      const lbl = i===0 ? 'Today' : day.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      const pctNum = Math.round((count/cap)*100);
      const color = pctNum>=90 ? 'var(--danger)' : pctNum>=70 ? 'var(--gold)' : 'var(--forest)';
      series.push({label:lbl, value:count, valueLabel:count+'/'+cap+' · '+pctNum+'%', color:color});
    }
    if(!any) return '<div style="padding:10px 0;color:var(--ink-faint);font-size:13px">No confirmed stays in the next 14 days.</div>';
    return '<div style="font-size:11px;color:var(--ink-faint);margin-bottom:10px">Capacity '+cap+' spaces · next 14 days</div>'+renderSeries(series);
  }

  if(trendView==='volume'){
    const months={};
    bk.forEach(function(b){ const d=new Date(b.saved_at||b.checkin); if(isNaN(d)) return; const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); months[key]=(months[key]||0)+1; });
    const keys=Object.keys(months).sort().slice(-6);
    if(!keys.length) return empty;
    const series=keys.map(function(k){
      const parts=k.split('-');
      const lbl=new Date(+parts[0],+parts[1]-1,1).toLocaleDateString('en-US',{month:'short',year:'2-digit'});
      return {label:lbl, value:months[k], valueLabel:months[k]+' visit'+(months[k]!==1?'s':''), color:'var(--brown)'};
    });
    return renderSeries(series);
  }

  if(trendView==='breeds'){
    const breeds={};
    dg.forEach(function(d){ const b=(d.breed||'').trim()||'Unknown'; breeds[b]=(breeds[b]||0)+1; });
    const topBreeds=Object.entries(breeds).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
    const ownerCounts={};
    bk.forEach(function(b){ (b.entries||[]).forEach(function(e){ const o=(e.ownerName||'').trim(); if(o) ownerCounts[o]=(ownerCounts[o]||0)+1; }); });
    const repeats=Object.entries(ownerCounts).filter(function(e){return e[1]>1;}).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
    if(!topBreeds.length && !repeats.length) return empty;
    let out='';
    if(topBreeds.length){
      const max=topBreeds[0][1];
      out += '<div style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Top breeds</div>';
      out += topBreeds.map(function(e){return trendBar(e[0], e[1], max, e[1]+' dog'+(e[1]!==1?'s':''), 'var(--brown)');}).join('');
    }
    if(repeats.length){
      const max=repeats[0][1];
      out += '<div style="font-size:11px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.05em;margin:14px 0 8px">Repeat customers</div>';
      out += repeats.map(function(e){return trendBar(e[0], e[1], max, e[1]+' stays', 'var(--gold)');}).join('');
    } else {
      out += '<div style="margin-top:12px;font-size:12px;color:var(--ink-faint)">No repeat customers yet.</div>';
    }
    return out;
  }

  if(trendView==='los'){
    let totalNights=0, n=0;
    bk.forEach(function(b){ if(b.service==='daycare') return; const ci=new Date(b.checkin), co=new Date(b.checkout); if(isNaN(ci)||isNaN(co)) return; const nights=Math.max(1,Math.round((co-ci)/86400000)); totalNights+=nights; n++; });
    if(!n) return empty;
    const avg=(totalNights/n).toFixed(1);
    return trendStat(avg+' nights', 'Average boarding stay · across '+n+' completed stay'+(n!==1?'s':''));
  }

  if(trendView==='revpak'){
    const cap = (typeof settings!=='undefined' && settings.capacity) ? settings.capacity : 12;
    let rev=0, minD=null, maxD=null;
    bk.forEach(function(b){ const amt=parseFloat(b.grand_total)||0; rev+=amt; const d=new Date(b.saved_at||b.checkin); if(!isNaN(d)){ if(!minD||d<minD)minD=d; if(!maxD||d>maxD)maxD=d; } });
    if(rev<=0||!minD) return empty;
    const days=Math.max(1,Math.round((maxD-minD)/86400000)+1);
    const revpak=rev/(cap*days);
    return trendStat('$'+revpak.toFixed(2), 'Per kennel-night available · '+cap+' kennels over '+days+' day'+(days!==1?'s':''))
      + '<div style="font-size:11px;color:var(--ink-faint);text-align:center;margin-top:-6px">Higher = better use of capacity</div>';
  }

  if(trendView==='retention'){
    const seen={}; let nw=0, ret=0;
    const ordered=bk.slice().sort(function(a,b){return new Date(a.saved_at||a.checkin)-new Date(b.saved_at||b.checkin);});
    ordered.forEach(function(b){ (b.entries||[]).forEach(function(e){ const o=(e.ownerName||'').trim().toLowerCase(); if(!o) return; if(seen[o]) ret++; else { nw++; seen[o]=true; } }); });
    const total=nw+ret;
    if(!total) return empty;
    const series=[
      {label:'🆕 New customers', value:nw, valueLabel:nw+' · '+Math.round(nw/total*100)+'%', color:'var(--forest)'},
      {label:'🔁 Returning', value:ret, valueLabel:ret+' · '+Math.round(ret/total*100)+'%', color:'var(--gold)'}
    ];
    const note = trendFormat==='donut' ? '' : '<div style="font-size:11px;color:var(--ink-faint);text-align:center;margin-top:6px">Higher returning share = stronger loyalty</div>';
    return renderSeries(series)+note;
  }

  if(trendView==='dow'){
    const dows=[0,0,0,0,0,0,0]; const names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    bk.forEach(function(b){ const d=new Date(b.checkin); if(!isNaN(d)) dows[d.getDay()]++; });
    rq.filter(function(r){return r.status==='confirmed'||r.status==='checked_in';}).forEach(function(r){ const d=new Date(r.actual_checkin||r.checkin); if(!isNaN(d)) dows[d.getDay()]++; });
    const total=dows.reduce(function(a,b){return a+b;},0);
    if(!total) return empty;
    const order=[1,2,3,4,5,6,0];
    const series=order.map(function(i){ return {label:names[i], value:dows[i], valueLabel:String(dows[i]), color:(i===0||i===6?'var(--gold)':'var(--brown)')}; });
    return renderSeries(series);
  }

  return empty;
}

/* ═══════════════════════════════════════
   Booking Outlook — occupancy across a selectable horizon
   (1 week / 2 weeks / 3 weeks / month)
═══════════════════════════════════════ */
let outlookDays = 7; // 7, 14, 21, or 30
function setOutlook(n){ outlookDays = n; renderOutlook(); }
function renderOutlook(){
  const host = document.getElementById('dash-outlook');
  if(!host) return;
  const cap = (typeof settings!=='undefined' && settings.capacity) ? settings.capacity : 12;
  const occFn = (typeof dayOccupancy==='function') ? dayOccupancy : function(){return 0;};
  const today = new Date(); today.setHours(0,0,0,0);

  // Build per-day data across the horizon
  const data = [];
  for(let i=0;i<outlookDays;i++){
    const d = new Date(today); d.setDate(d.getDate()+i);
    const ds = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    data.push({ date:d, ds:ds, count:occFn(ds) });
  }
  // Summary stats
  const counts = data.map(d=>d.count);
  const totalDogNights = counts.reduce((a,b)=>a+b,0);
  const avg = (totalDogNights / outlookDays);
  const peak = Math.max.apply(null, counts.concat([0]));
  const peakDay = data.find(d=>d.count===peak);
  const fullDays = data.filter(d=>d.count>=cap).length;
  const nearDays = data.filter(d=>d.count===cap-1).length;
  const emptyDays = data.filter(d=>d.count===0).length;
  const avgPct = Math.round((avg/cap)*100);

  // Distinct upcoming reservations starting in the window (arrivals)
  const horizonEnd = new Date(today); horizonEnd.setDate(horizonEnd.getDate()+outlookDays);
  const arrivals = (typeof requests!=='undefined'?requests:[]).filter(function(r){
    if(r.status!=='confirmed' && r.status!=='checked_in' && r.status!=='pending') return false;
    const ci = new Date(r.checkin); if(isNaN(ci)) return false;
    return ci>=today && ci<horizonEnd;
  }).length;

  const periodLabel = outlookDays===7?'Next 7 days':outlookDays===14?'Next 2 weeks':outlookDays===21?'Next 3 weeks':'Next 30 days';

  // Mini bar chart (one bar per day; width adapts)
  const maxScale = Math.max(cap, peak);
  const barW = outlookDays<=7?28:outlookDays<=14?16:outlookDays<=21?11:8;
  const bars = data.map(function(d){
    const h = maxScale>0 ? Math.round((d.count/maxScale)*70) : 0;
    let color = 'var(--forest)';
    if(d.count>=cap) color='var(--danger)';
    else if(d.count>=cap-1) color='var(--gold)';
    const isToday = d.ds === (today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0'));
    const showLbl = outlookDays<=14 || d.date.getDate()===1 || d.date.getDay()===1;
    return '<div onclick="openDayMo(\''+d.ds+'\')" title="'+d.date.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+': '+d.count+'/'+cap+'" style="flex:0 0 auto;width:'+barW+'px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px">'
      + '<div style="font-size:9px;color:var(--ink-faint);height:11px">'+(d.count||'')+'</div>'
      + '<div style="width:100%;height:70px;display:flex;align-items:flex-end"><div style="width:100%;height:'+Math.max(h,2)+'px;background:'+color+';border-radius:3px 3px 0 0;opacity:'+(isToday?'1':'0.85')+'"></div></div>'
      + '<div style="font-size:8px;color:'+(isToday?'var(--brown-dark)':'var(--ink-faint)')+';font-weight:'+(isToday?'700':'400')+'">'+(showLbl?d.date.getDate():'')+'</div>'
      + '</div>';
  }).join('');

  const tabs = [[7,'1 wk'],[14,'2 wk'],[21,'3 wk'],[30,'Month']].map(function(t){
    const on = outlookDays===t[0];
    return '<button class="btn '+(on?'btn-p':'btn-o')+' sm" style="font-size:11px;padding:5px 11px" onclick="setOutlook('+t[0]+')">'+t[1]+'</button>';
  }).join('');

  const stat = (big, label, color) => '<div style="flex:1;min-width:78px;text-align:center;padding:8px 4px;background:var(--cream-mid);border-radius:var(--r2)">'
    + '<div style="font-family:\'DM Serif Display\',serif;font-size:20px;line-height:1;color:'+(color||'var(--ink)')+'">'+big+'</div>'
    + '<div style="font-size:10px;color:var(--ink-faint);margin-top:3px">'+label+'</div></div>';

  host.innerHTML = '<div class="card">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;flex-wrap:wrap">'
    + '<div class="ct" style="margin:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>Booking Outlook</div>'
    + '<div style="display:flex;gap:5px;flex-wrap:wrap">'+tabs+'</div>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--ink-faint);margin-bottom:12px">'+periodLabel+' · capacity '+cap+'/day</div>'
    + '<div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">'
    + stat(arrivals, 'Arrivals', 'var(--brown-dark)')
    + stat(avgPct+'%', 'Avg occupancy', avgPct>=85?'var(--danger)':avgPct>=60?'var(--gold)':'var(--forest)')
    + stat(peak+'/'+cap, 'Peak day', peak>=cap?'var(--danger)':'var(--ink)')
    + stat(fullDays, 'Full days', fullDays>0?'var(--danger)':'var(--ink)')
    + stat(emptyDays, 'Empty days', 'var(--ink)')
    + '</div>'
    + '<div style="display:flex;gap:3px;overflow-x:auto;align-items:flex-end;padding-bottom:4px;-webkit-overflow-scrolling:touch">'+bars+'</div>'
    + (peakDay && peak>0 ? '<div style="font-size:11px;color:var(--ink-faint);margin-top:8px">Busiest: '+peakDay.date.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})+' ('+peak+'/'+cap+')'+(fullDays>0?' · '+fullDays+' day'+(fullDays!==1?'s':'')+' fully booked':'')+'</div>' : '<div style="font-size:11px;color:var(--ink-faint);margin-top:8px">No bookings in this period yet.</div>')
    + '</div>';
}

/* ═══════════════════════════════════════
   Upcoming Stays popup — list of stays over 1/2/3/4 weeks
   Shows arrival, departure, nights; pending visually marked.
═══════════════════════════════════════ */
let upcomingWeeks = 2;
function openUpcoming(){ document.getElementById('upcoming-mo').classList.add('on'); renderUpcomingList(); }
function closeUpcoming(){ document.getElementById('upcoming-mo').classList.remove('on'); }
function setUpcomingWeeks(n){ upcomingWeeks = n; renderUpcomingList(); }
function renderUpcomingList(){
  const body=document.getElementById('upcoming-body');
  if(!body) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const horizonEnd=new Date(today); horizonEnd.setDate(horizonEnd.getDate()+upcomingWeeks*7);

  // Currently boarding = checked in right now (shown pinned at top, regardless of window)
  const boardingNow=(typeof requests!=='undefined'?requests:[]).filter(function(r){
    return r.status==='checked_in';
  }).sort(function(a,b){ return new Date(a.checkout)-new Date(b.checkout); }); // soonest to leave first

  // Arriving = confirmed/pending stays whose arrival falls within the window
  const stays=(typeof requests!=='undefined'?requests:[]).filter(function(r){
    if(r.status!=='confirmed' && r.status!=='pending') return false;
    const ci=new Date(r.checkin); if(isNaN(ci)) return false;
    const ciMid=new Date(ci.getFullYear(),ci.getMonth(),ci.getDate());
    return ciMid>=today && ciMid<horizonEnd;
  }).sort(function(a,b){ return new Date(a.checkin)-new Date(b.checkin); });

  const tabs=[[1,'1 wk'],[2,'2 wk'],[3,'3 wk'],[4,'4 wk']].map(function(t){
    const on=upcomingWeeks===t[0];
    return '<button class="btn '+(on?'btn-p':'btn-o')+' sm" style="font-size:11px;padding:5px 12px" onclick="setUpcomingWeeks('+t[0]+')">'+t[1]+'</button>';
  }).join('');

  const fd=function(d){ return new Date(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); };
  const nights=function(ci,co){ const a=new Date(ci),b=new Date(co); if(isNaN(a)||isNaN(b))return 0; return Math.max(0,Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate())-new Date(a.getFullYear(),a.getMonth(),a.getDate()))/86400000)); };

  // Summary
  let totalNights=0, confirmedCount=0, pendingCount=0;
  stays.forEach(function(r){ totalNights+=(r.dog_ids&&r.dog_ids.length?r.dog_ids.length:1)*nights(r.checkin,r.checkout); if(r.status==='pending')pendingCount++; else confirmedCount++; });
  let boardingDogs=0;
  boardingNow.forEach(function(r){ boardingDogs+=(r.dog_ids&&r.dog_ids.length?r.dog_ids.length:1); });

  // Row builder for "arriving" stays (shows arrival → departure, nights)
  function arrivingRow(r){
    const isPending=r.status==='pending';
    const n=nights(r.checkin,r.checkout);
    const dogCount=(r.dog_ids&&r.dog_ids.length)?r.dog_ids.length:1;
    const svc=r.service==='boarding'?'🏡':'☀️';
    const statusBadge=isPending
      ? '<span style="font-size:10px;font-weight:700;color:var(--gold);background:rgba(217,164,65,0.15);padding:2px 7px;border-radius:20px">PENDING</span>'
      : '<span style="font-size:10px;font-weight:700;color:var(--brown-dark);background:var(--cream-mid);padding:2px 7px;border-radius:20px">CONFIRMED</span>';
    return '<div onclick="closeUpcoming();openDayMo(\''+_dsOf(new Date(r.checkin))+'\')" style="display:flex;align-items:center;gap:11px;padding:11px;border-bottom:1px solid var(--cream-mid);cursor:pointer'+(isPending?';opacity:.92;background:rgba(217,164,65,0.04)':'')+'">'
      + '<div style="font-size:18px">'+svc+'</div>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:14px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.dog_name||'')+(dogCount>1?' <span style="font-size:11px;color:var(--ink-faint)">('+dogCount+' dogs)</span>':'')+'</div>'
      + '<div style="font-size:12px;color:var(--ink-faint);margin-top:1px">'+fd(r.checkin)+' → '+fd(r.checkout)+'</div>'
      + '</div>'
      + '<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:3px">'
      + '<div style="font-family:\'DM Serif Display\',serif;font-size:15px;color:var(--ink);line-height:1">'+(r.service==='daycare'?'day':n+'<span style="font-size:10px;font-family:\'DM Sans\',sans-serif;color:var(--ink-faint)"> night'+(n!==1?'s':'')+'</span>')+'</div>'
      + statusBadge
      + '</div></div>';
  }

  // Row builder for "currently boarding" dogs (shows checkout date / nights left)
  function boardingRow(r){
    const dogCount=(r.dog_ids&&r.dog_ids.length)?r.dog_ids.length:1;
    const svc=r.service==='boarding'?'🏡':'☀️';
    const co=new Date(r.checkout);
    const coMid=new Date(co.getFullYear(),co.getMonth(),co.getDate());
    const nleft=isNaN(co)?0:Math.max(0,Math.round((coMid-today)/86400000));
    const leaveToday=nleft===0;
    return '<div onclick="closeUpcoming();openDayMo(\''+_dsOf(new Date(r.actual_checkin||r.checkin))+'\')" style="display:flex;align-items:center;gap:11px;padding:11px;border-bottom:1px solid var(--cream-mid);cursor:pointer;background:rgba(74,103,65,0.04)">'
      + '<div style="font-size:18px">'+svc+'</div>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:14px;font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.dog_name||'')+(dogCount>1?' <span style="font-size:11px;color:var(--ink-faint)">('+dogCount+' dogs)</span>':'')+'</div>'
      + '<div style="font-size:12px;color:var(--ink-faint);margin-top:1px">'+(r.service==='daycare'?'Here today':'Here until '+fd(r.checkout))+'</div>'
      + '</div>'
      + '<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:3px">'
      + '<div style="font-family:\'DM Serif Display\',serif;font-size:15px;color:'+(leaveToday?'var(--gold)':'var(--ink)')+';line-height:1">'+(r.service==='daycare'?'day':(leaveToday?'leaves<span style="font-size:10px;font-family:\'DM Sans\',sans-serif"> today</span>':nleft+'<span style="font-size:10px;font-family:\'DM Sans\',sans-serif;color:var(--ink-faint)"> night'+(nleft!==1?'s':'')+' left</span>'))+'</div>'
      + '<span style="font-size:10px;font-weight:700;color:var(--forest);background:rgba(74,103,65,0.12);padding:2px 7px;border-radius:20px">HERE NOW</span>'
      + '</div></div>';
  }

  // Currently boarding section (pinned at top, only if any)
  let boardingSection='';
  if(boardingNow.length){
    boardingSection='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--forest);margin:0 0 6px">Currently boarding ('+boardingDogs+')</div>'
      + '<div style="border:1px solid var(--cream-dark);border-radius:var(--r2);overflow:hidden;margin-bottom:16px">'+boardingNow.map(boardingRow).join('')+'</div>';
  }

  // Arriving section
  let arrivingSection;
  if(!stays.length){
    arrivingSection='<div style="padding:24px 0;text-align:center;color:var(--ink-faint);font-size:13px">No arrivals in the next '+upcomingWeeks+' week'+(upcomingWeeks!==1?'s':'')+'.</div>';
  } else {
    arrivingSection='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-mid);margin:0 0 6px">Arriving</div>'
      + '<div style="border:1px solid var(--cream-dark);border-radius:var(--r2);overflow:hidden">'+stays.map(arrivingRow).join('')+'</div>';
  }

  body.innerHTML='<div style="display:flex;gap:5px;margin-bottom:12px;flex-wrap:wrap">'+tabs+'</div>'
    + '<div style="display:flex;gap:14px;margin-bottom:14px;font-size:12px;color:var(--ink-faint);flex-wrap:wrap">'
    + (boardingNow.length?'<span><strong style="color:var(--forest)">'+boardingDogs+'</strong> boarding now</span>':'')
    + '<span><strong style="color:var(--ink)">'+stays.length+'</strong> arriving</span>'
    + '<span><strong style="color:var(--ink)">'+totalNights+'</strong> dog-nights</span>'
    + (pendingCount?'<span><strong style="color:var(--gold)">'+pendingCount+'</strong> pending</span>':'')
    + '</div>'
    + boardingSection
    + arrivingSection;
}

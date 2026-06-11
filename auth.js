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
}

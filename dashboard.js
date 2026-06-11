/* ═══════════════════════════════════════
   FINANCE
═══════════════════════════════════════ */
function finPreset(p){
  ['1m','3m','ytd','all'].forEach(k=>{ const b=document.getElementById('fin-p-'+k); if(b){ b.classList.toggle('btn-p',k===p); b.classList.toggle('btn-o',k!==p); }});
  const now=new Date(); let from;
  if(p==='1m') from=new Date(now.getFullYear(),now.getMonth(),1);
  else if(p==='3m'){ from=new Date(now.getFullYear(),now.getMonth()-2,1); }
  else if(p==='ytd') from=new Date(now.getFullYear(),0,1);
  else { // all
    const dates=bookings.map(b=>new Date(b.saved_at||b.checkin)).filter(d=>!isNaN(d));
    from=dates.length?new Date(Math.min(...dates)):new Date(now.getFullYear(),0,1);
  }
  document.getElementById('fin-from').value=dStr(from);
  document.getElementById('fin-to').value=dStr(now);
  renderFinance();
}
function renderFinance(){
  const fromV=document.getElementById('fin-from').value, toV=document.getElementById('fin-to').value;
  if(!fromV||!toV) return;
  const from=new Date(fromV+'T00:00:00'), to=new Date(toV+'T23:59:59');
  // Use checkout date as the income-recognition date
  const inRange=bookings.filter(b=>{ const d=new Date(b.checkout||b.saved_at); return d>=from&&d<=to; })
    .sort((a,b)=>new Date(b.checkout||b.saved_at)-new Date(a.checkout||a.saved_at));
  const total=inRange.reduce((s,b)=>s+parseFloat(b.grand_total||0),0);
  const cnt=inRange.length;
  const collected=inRange.filter(b=>b.paid).reduce((s,b)=>s+parseFloat(b.grand_total||0),0);
  const outstanding=total-collected;
  const unpaidCnt=inRange.filter(b=>!b.paid).length;
  // Summary cards
  document.getElementById('fin-cards').innerHTML=`
    <div class="card" style="margin:0;text-align:center"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint)">Total Billed</div><div style="font-family:'DM Serif Display',serif;font-size:26px;color:var(--brown-dark);margin-top:4px">$${total.toFixed(0)}</div><div style="font-size:11px;color:var(--ink-faint);margin-top:2px">${cnt} invoice${cnt!==1?'s':''}</div></div>
    <div class="card" style="margin:0;text-align:center"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint)">Collected</div><div style="font-family:'DM Serif Display',serif;font-size:26px;color:var(--forest);margin-top:4px">$${collected.toFixed(0)}</div><div style="font-size:11px;color:var(--ink-faint);margin-top:2px">paid</div></div>
    <div class="card" style="margin:0;text-align:center"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint)">Outstanding</div><div style="font-family:'DM Serif Display',serif;font-size:26px;color:${outstanding>0?'var(--danger)':'var(--ink)'};margin-top:4px">$${outstanding.toFixed(0)}</div><div style="font-size:11px;color:var(--ink-faint);margin-top:2px">${unpaidCnt} unpaid</div></div>`;
  // Monthly chart
  const byMonth={};
  inRange.forEach(b=>{ const d=new Date(b.checkout||b.saved_at); const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); byMonth[k]=(byMonth[k]||0)+parseFloat(b.grand_total||0); });
  const months=Object.keys(byMonth).sort();
  const chart=document.getElementById('fin-chart');
  if(!months.length){ chart.innerHTML='<div class="es" style="padding:16px"><span class="ei" style="font-size:22px">📊</span><p>No income in this range</p></div>'; }
  else {
    const max=Math.max(...months.map(m=>byMonth[m]));
    chart.innerHTML='<div style="display:flex;align-items:flex-end;gap:8px;height:140px;padding-top:10px">'+months.map(m=>{
      const h=max?Math.round(byMonth[m]/max*110):0;
      const lbl=new Date(m+'-01T12:00:00').toLocaleDateString('en-US',{month:'short',year:'2-digit'});
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0">
        <div style="font-size:10px;font-weight:600;color:var(--ink-mid);white-space:nowrap">$${Math.round(byMonth[m])}</div>
        <div style="width:100%;max-width:46px;height:${h}px;background:linear-gradient(var(--brown),var(--brown-dark));border-radius:5px 5px 0 0;min-height:3px"></div>
        <div style="font-size:10px;color:var(--ink-faint);white-space:nowrap">${lbl}</div>
      </div>`;
    }).join('')+'</div>';
  }
  // Invoice list
  const list=document.getElementById('fin-list');
  if(!inRange.length){ list.innerHTML='<div class="es" style="padding:16px"><span class="ei" style="font-size:22px">📄</span><p>No invoices in this range</p></div>'; return; }
  const fd=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  list.innerHTML='<div style="display:flex;flex-direction:column;gap:1px">'+inRange.map(b=>{
    const names=(b.entries||[]).map(e=>e.dogName||'').join(', ');
    return `<div onclick="openInv('${b.id}')" style="display:flex;align-items:center;gap:10px;padding:11px 4px;border-bottom:1px solid var(--cream-mid);cursor:pointer">
      <div style="font-size:18px">${b.service==='boarding'?'🏡':'☀️'}</div>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">${esc(names)} ${b.paid?'<span style="font-size:10px;color:var(--forest);font-weight:600">✓ Paid</span>':'<span style="font-size:10px;color:var(--danger);font-weight:600">● Unpaid</span>'}</div><div style="font-size:11px;color:var(--ink-faint)">INV-${b.id.slice(-6).toUpperCase()} · ${fd(b.checkout||b.saved_at)}</div></div>
      <div style="font-family:'DM Serif Display',serif;font-size:16px;color:var(--ink)">$${parseFloat(b.grand_total).toFixed(2)}</div>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
  }).join('')+'</div>';
}
async function exportFinance(){
  const fromV=document.getElementById('fin-from').value, toV=document.getElementById('fin-to').value;
  if(!fromV||!toV){ toast('Pick a date range first.', true); return; }
  const from=new Date(fromV+'T00:00:00'), to=new Date(toV+'T23:59:59');
  const inRange=bookings.filter(b=>{ const d=new Date(b.checkout||b.saved_at); return d>=from&&d<=to; })
    .sort((a,b)=>new Date(a.checkout||a.saved_at)-new Date(b.checkout||b.saved_at));
  if(!inRange.length){ toast('No invoices to export.', true); return; }
  try{
    const XLSX=await getXLSX();
    const rows=[['Invoice','Date','Dog(s)','Owner(s)','Service','Check-In','Check-Out','Discount','Total']];
    inRange.forEach(b=>{
      const e0=(b.entries||[])[0]||{};
      rows.push(['INV-'+b.id.slice(-6).toUpperCase(), new Date(b.checkout||b.saved_at).toLocaleDateString('en-US'),
        (b.entries||[]).map(e=>e.dogName||'').join(', '), (b.entries||[]).map(e=>e.ownerName||'').join(', '),
        b.service==='boarding'?'Boarding':'Day Care', new Date(b.checkin).toLocaleString('en-US'), new Date(b.checkout).toLocaleString('en-US'),
        e0.discount?parseFloat(e0.discount):0, parseFloat(b.grand_total||0)]);
    });
    const total=inRange.reduce((s,b)=>s+parseFloat(b.grand_total||0),0);
    rows.push(['','','','','','','','Total',total]);
    const ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=[{wch:14},{wch:13},{wch:20},{wch:20},{wch:11},{wch:20},{wch:20},{wch:10},{wch:11}];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Income');
    XLSX.writeFile(wb,'shvaan-income-'+fromV+'-to-'+toV+'.xlsx');
    toast('Exported '+inRange.length+' invoice'+(inRange.length!==1?'s':'')+'.');
  }catch(e){ toast('Export failed: '+e.message, true); }
}

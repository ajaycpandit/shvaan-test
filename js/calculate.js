/* ═══════════════════════════════════════
   CALCULATE
═══════════════════════════════════════ */
function setSvc(s) {
  svc = s;
  document.getElementById('svc-boarding').classList.toggle('active', s==='boarding');
  document.getElementById('svc-daycare').classList.toggle('active', s==='daycare');
  recalc();
}
function getTimes() {
  const ci=document.getElementById('ci-d').value, ct=document.getElementById('ci-t').value;
  const co=document.getElementById('co-d').value, ot=document.getElementById('co-t').value;
  if(!ci||!ct||!co||!ot) return null;
  const i=new Date(ci+'T'+ct), o=new Date(co+'T'+ot);
  if(isNaN(i)||isNaN(o)||o<=i) return null;
  return {i,o};
}
function calcDog(dog, i, o) {
  // Calculator uses the exact same engine as checkout/invoice.
  // `svc` is the calculator's current service toggle (boarding/daycare).
  return calcDogSvc(dog, i, o, svc);
}
// Service-explicit version (doesn't depend on the global svc) used by the reservation workflow
function calcDogSvc(dog, i, o, service) {
  const s = settings;
  const rate = dog && dog.rate_override!=null ? parseFloat(dog.rate_override) : (service==='boarding'?s.boardingRate:s.daycareRate);
  const hrs = (o-i)/3600000;
  if(service==='daycare') {
    const days=Math.max(1,Math.ceil(hrs/24));
    return {rate, fullDays:days, extraHrs:0, surcharge:0, total:+(rate*days).toFixed(2), hrs:+hrs.toFixed(2)};
  }
  // Boarding: count complete 24h periods, then evaluate late-checkout rules on the leftover.
  let full = Math.floor(hrs/24);
  const rem = hrs - full*24;
  let billDays = full;
  let surcharge = 0;
  const lines = []; // itemized extras for the invoice: {label, amount}

  // Configurable rules from settings.lateRules. Each rule:
  //  { minH, maxH, action:'percent'|'fixed'|'fullday', value, label, stack, enabled }
  // Evaluated top to bottom; a matching non-stacking rule stops further evaluation.
  const rules = (s.lateRules && s.lateRules.length) ? s.lateRules : defaultLateRules(s);
  for(let idx=0; idx<rules.length; idx++){
    const r = rules[idx];
    if(r.enabled===false) continue;
    const minH = (r.minH!=null?r.minH:0);
    const maxH = (r.maxH!=null?r.maxH:Infinity);
    // Lower bound is exclusive by default (> minH); set minInclusive:true for >= minH.
    // Upper bound is inclusive (<= maxH). This lets adjacent tiers meet at a boundary,
    // e.g. surcharge (3, 8] and full-day [8, 24] both able to own exactly 8h depending on order.
    const lowOk = r.minInclusive ? (rem >= minH) : (rem > minH);
    if(lowOk && rem <= maxH){
      let amt = 0;
      if(r.action==='percent') amt = rate*(r.value||0)/100;
      else if(r.action==='fixed') amt = (r.value||0);
      else if(r.action==='fullday') amt = rate; // full extra day's price, shown as a line
      amt = +amt.toFixed(2);
      if(amt>0){ surcharge += amt; lines.push({label:r.label||'Late checkout', amount:amt}); }
      if(!r.stack) break;
    }
  }

  if(billDays < 1 && rem > 0) billDays = 1; // minimum one day for any boarding stay
  surcharge = +surcharge.toFixed(2);
  const total = +((rate*billDays)+surcharge).toFixed(2);
  return {rate, fullDays:billDays, extraHrs:+rem.toFixed(2), surcharge, total, hrs:+hrs.toFixed(2), lines};
}
// Default late-checkout rules derived from legacy settings, so behavior is unchanged
// until the owner customizes them:  grace..8h -> surcharge;  >=8h -> full day (labeled as surcharge).
function defaultLateRules(s){
  const grace = (s.threshold!=null ? s.threshold : 3);
  const fullDayH = (s.fullDayHrs!=null ? s.fullDayHrs : 8);
  const isFixed = s.surchargeType==='fixed';
  return [
    // Evaluated in order. Full-day first so exactly-8h (and beyond) claims the full-day tier.
    { minH:fullDayH, maxH:24, minInclusive:true, action:'fullday', value:0,
      label:'Late checkout (full day)', stack:false, enabled:true },
    { minH:grace, maxH:fullDayH, action:(isFixed?'fixed':'percent'), value:(isFixed?(s.surchargeAmt||0):(s.surchargePct||0)),
      label:'Late checkout'+(isFixed?'':' ('+(s.surchargePct||0)+'%)'), stack:false, enabled:true }
  ];
}
function recalc() {
  const ra=document.getElementById('result-area'), sr=document.getElementById('save-row');
  const times=getTimes(), sel=dogs.filter(d=>selDogs.has(d.id));
  if(!times||!sel.length) {
    ra.innerHTML='<div class="es"><span class="ei">🧮</span><p>Select dogs and set dates to calculate</p></div>';
    sr.style.display='none'; return;
  }
  const {i,o}=times, res=sel.map(d=>({dog:d,...calcDog(d,i,o)}));
  const grand=res.reduce((a,r)=>a+r.total,0);
  const fd=d=>d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  const tRows=res.map(r=>`<tr>
    <td><div class="drn">${esc(r.dog.dog_name)}</div><div class="dro">${esc(r.dog.owner_name)}</div></td>
    <td>$${r.rate.toFixed(2)}</td>
    <td>${r.fullDays}d${r.extraHrs>0?' + '+r.extraHrs+'h':''}</td>
    <td>${r.surcharge>0?`<span class="bdg bdg-w">+$${r.surcharge.toFixed(2)}</span>`:'<span class="bdg bdg-g">None</span>'}</td>
    <td>$${r.total.toFixed(2)}</td>
  </tr>`).join('');
  const mCards=res.map(r=>`<div style="background:var(--cream-mid);border-radius:var(--r2);padding:10px 12px;margin-bottom:7px;border:1px solid var(--cream-dark)">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <div><div class="drn">${esc(r.dog.dog_name)}</div><div class="dro">${esc(r.dog.owner_name)}</div></div>
      <div style="font-size:16px;font-weight:700;color:var(--ink)">$${r.total.toFixed(2)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:11px;color:var(--ink-light)">
      <div>Rate<span style="display:block;font-size:12px;font-weight:600;color:var(--ink-mid)">$${r.rate.toFixed(2)}/day</span></div>
      <div>Duration<span style="display:block;font-size:12px;font-weight:600;color:var(--ink-mid)">${r.fullDays}d${r.extraHrs>0?' + '+r.extraHrs+'h':''}</span></div>
      ${r.surcharge>0?`<div>Surcharge<span style="display:block"><span class="bdg bdg-w">+$${r.surcharge.toFixed(2)}</span></span></div>`:''}
    </div>
  </div>`).join('');
  ra.innerHTML=`
    <div class="bw"><table class="bt"><thead><tr><th>Dog / Owner</th><th>Rate</th><th>Duration</th><th>Surcharge</th><th>Amount</th></tr></thead><tbody>${tRows}</tbody></table></div>
    <div class="mbk">${mCards}</div>
    <div class="gtbar">
      <div><div class="gtlbl">${svc==='boarding'?'🏡 Boarding':'☀️ Day Care'} Total</div><div class="gtmeta">${fd(i)} → ${fd(o)}</div></div>
      <div class="gtval">$${grand.toFixed(2)}</div>
    </div>`;
  sr.style.display='flex';
}

async function saveAsReservation() {
  const times=getTimes(), sel=dogs.filter(d=>selDogs.has(d.id));
  if(!times||!sel.length) return;
  const {i,o}=times;
  setSyncState('busy');
  try {
    // One reservation per selected dog
    const created=[];
    for(const dog of sel){
      const rec={ id:Date.now().toString()+Math.random().toString(36).slice(2), dog_id:dog.id, dog_name:dog.dog_name, owner_name:dog.owner_name, service:svc, checkin:i.toISOString(), checkout:o.toISOString(), notes:dog.notes||null, status:'pending', created_at:new Date().toISOString() };
      await dbAddReq(rec);
      created.push(rec);
    }
    requests.unshift(...created);
    setSyncState('ok'); updateBadges();
    toast(created.length>1?created.length+' reservations created!':'Reservation created!');
    clearCalc();
    goPage('requests');
  } catch(e) { setSyncState('err'); toast('Save failed: '+e.message, true); }
}

function clearCalc() {
  selDogs.clear();
  document.getElementById('ci-d').value=''; document.getElementById('ci-t').value='10:00';
  document.getElementById('co-d').value=''; document.getElementById('co-t').value='10:00';
  renderDD(); recalc();
}

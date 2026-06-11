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
  const s = settings;
  const rate = dog.rate_override!=null ? parseFloat(dog.rate_override) : (svc==='boarding'?s.boardingRate:s.daycareRate);
  const hrs = (o-i)/3600000;
  if(svc==='daycare') {
    const days=Math.max(1,Math.ceil(hrs/24));
    return {rate, fullDays:days, extraHrs:0, surcharge:0, total:+(rate*days).toFixed(2), hrs:+hrs.toFixed(2)};
  }
  const full=Math.floor(hrs/24), rem=hrs-full*24;
  const sur = rem>s.threshold ? +(rate*s.surchargePct/100).toFixed(2) : 0;
  const total = +((full===0&&rem>0 ? rate : rate*full)+sur).toFixed(2);
  return {rate, fullDays:full, extraHrs:+rem.toFixed(2), surcharge:sur, total, hrs:+hrs.toFixed(2)};
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
  const full=Math.floor(hrs/24), rem=hrs-full*24;
  const sur = rem>s.threshold ? +(rate*s.surchargePct/100).toFixed(2) : 0;
  const total = +((full===0&&rem>0 ? rate : rate*full)+sur).toFixed(2);
  return {rate, fullDays:full, extraHrs:+rem.toFixed(2), surcharge:sur, total, hrs:+hrs.toFixed(2)};
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

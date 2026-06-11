/* ═══════════════════════════════════════
   INVOICE
═══════════════════════════════════════ */
function buildInv(b) {
  const s=settings, biz=s.bizName||'Paws & Board';
  const bizL=[s.bizPhone,s.bizEmail,s.bizAddr].filter(Boolean).join('<br>');
  const fd=str=>new Date(str).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const ft=str=>new Date(str).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  const invNum='INV-'+b.id.slice(-6).toUpperCase();
  const issued=new Date(b.saved_at||b.savedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const entries=b.entries||[];
  const reqIn=b.requested_checkin||(entries[0]&&entries[0].requested_checkin);
  const reqOut=b.requested_checkout||(entries[0]&&entries[0].requested_checkout);
  const dcards=entries.map(e=>`<div class="idc"><div class="ida">${e.photo?`<img src="${e.photo}" alt="">`:'🐶'}</div><div><div class="idname">${esc(e.dogName||'')}</div><div class="idowner">${esc(e.ownerName||'')}${e.phone?' · '+esc(e.phone):''}</div></div></div>`).join('');
  const rows=entries.map(e=>{
    const dl=b.service==='boarding'?`${e.fullDays}d${e.extraHrs>0?' + '+e.extraHrs+'h':''}`:`${e.fullDays}d`;
    const sr=e.surcharge>0?`<tr><td style="padding-left:10px;color:var(--ink-faint);font-size:10px">↳ Late checkout (${s.surchargePct}%)</td><td colspan="2"></td><td style="text-align:right;color:var(--ink-faint);font-size:10px">$${parseFloat(e.surcharge).toFixed(2)}</td></tr>`:'';
    return `<tr><td><strong>${esc(e.dogName||'')}</strong></td><td>$${parseFloat(e.rate).toFixed(2)}/day</td><td>${dl}</td><td>$${(parseFloat(e.total)-parseFloat(e.surcharge)).toFixed(2)}</td></tr>${sr}`;
  }).join('');
  return `
    <div class="iheader">
      <div><img class="logo-invoice" alt="" style="height:46px;width:140px;object-fit:contain;object-position:left;margin-bottom:6px"><div class="ibiz-name">${esc(biz)}</div>${bizL?`<div style="font-size:11px;color:var(--ink-faint);margin-top:3px;line-height:1.5">${bizL}</div>`:''}</div>
      <div class="inum"><div class="ilbl">Invoice</div><div class="ival">${invNum}</div><div style="font-size:11px;color:var(--ink-faint);margin-top:3px">Issued ${issued}</div><div style="margin-top:7px">${b.service==='boarding'?'<span class="sp sp-b">🏡 Boarding</span>':'<span class="sp sp-d">☀️ Day Care</span>'}</div></div>
    </div>
    <div class="ilbl" style="margin-bottom:7px">Guests</div><div class="idg">${dcards}</div>
    ${(reqIn||reqOut)?`<div class="iig"><div><div class="ilbl">Requested Check-In</div><div class="iiv" style="color:var(--ink-light)">${fd(reqIn)}<br>${ft(reqIn)}</div></div><div><div class="ilbl">Requested Check-Out</div><div class="iiv" style="color:var(--ink-light)">${fd(reqOut)}<br>${ft(reqOut)}</div></div></div>`:''}
    <div class="iig"><div><div class="ilbl">${(reqIn||reqOut)?'Actual ':''}Check-In</div><div class="iiv">${fd(b.checkin)}<br><strong>${ft(b.checkin)}</strong></div></div><div><div class="ilbl">${(reqIn||reqOut)?'Actual ':''}Check-Out</div><div class="iiv">${fd(b.checkout)}<br><strong>${ft(b.checkout)}</strong></div></div></div>
    <div class="ilbl" style="margin-bottom:7px">Charges</div>
    <table class="itable"><thead><tr><th>Dog</th><th>Rate</th><th>Duration</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
    ${(entries[0]&&entries[0].discount>0)?`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--coral);margin-bottom:8px;padding:0 2px"><span>Discount${entries[0].discount_type==='pct'?' ('+entries[0].discount_val+'%)':''}</span><span>−$${parseFloat(entries[0].discount).toFixed(2)}</span></div>`:''}
    <div class="itotal"><span class="itlbl">Total Due</span><span class="itval">$${parseFloat(b.grand_total).toFixed(2)}</span></div>
    ${b.paid?`<div style="text-align:right;margin-top:8px;font-size:13px;font-weight:600;color:var(--forest)">✓ PAID${b.payment_method?' · '+esc(b.payment_method):''}${b.paid_at?' · '+new Date(b.paid_at+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''}</div>`:''}
    <div class="ifooter">Thank you for trusting us with your furry family member! 🐾</div>`;
}

function openInv(id) {
  const b=bookings.find(x=>x.id===id); if(!b) return;
  document.getElementById('inv-body').innerHTML=buildInv(b);
  applyLogo();
  document.getElementById('inv-overlay').classList.add('open');
  document.getElementById('inv-overlay').dataset.bid=id;
  document.querySelector('.inv-modal-inner').scrollTo(0,0);
  invBid=id;
}
function closeInv(){ document.getElementById('inv-overlay').classList.remove('open'); invBid=null; }
function printInv(){ doPrint(invBid); }
function printDirect(id){ doPrint(id); }
function doPrint(id) {
  const b=bookings.find(x=>x.id===id); if(!b) return;
  const pf=document.getElementById('printable'); pf.innerHTML=buildInv(b); applyLogo(); pf.style.display='block';
  setTimeout(()=>{ window.print(); pf.style.display='none'; },100);
}
document.getElementById('inv-overlay').addEventListener('click',function(e){ if(e.target===this) closeInv(); });

/* ── Edit booking dates (after invoice created) ── */
let editBkId=null, ebDiscType='pct';
function openEditBooking(id){
  const b=bookings.find(x=>x.id===id); if(!b) return;
  editBkId=id;
  const e0=(b.entries&&b.entries[0])||{};
  document.getElementById('eb-dogname').textContent=(b.entries||[]).map(e=>e.dogName).join(', ')+' · '+(b.service==='boarding'?'Boarding':'Day Care');
  document.getElementById('eb-ci').value=dStr(new Date(b.checkin));
  document.getElementById('eb-ci-t').value=tStr(new Date(b.checkin));
  document.getElementById('eb-co').value=dStr(new Date(b.checkout));
  document.getElementById('eb-co-t').value=tStr(new Date(b.checkout));
  ebDiscType=e0.discount_type||'pct';
  document.getElementById('eb-disc-val').value=e0.discount_val||'';
  document.getElementById('eb-disc-pct').classList.toggle('active',ebDiscType==='pct');
  document.getElementById('eb-disc-amt').classList.toggle('active',ebDiscType==='amt');
  ebPreview();
  document.getElementById('editbk-mo').classList.add('on');
}
function closeEditBooking(){ document.getElementById('editbk-mo').classList.remove('on'); editBkId=null; }
function ebSetDiscType(t){ ebDiscType=t; document.getElementById('eb-disc-pct').classList.toggle('active',t==='pct'); document.getElementById('eb-disc-amt').classList.toggle('active',t==='amt'); ebPreview(); }
function ebCompute(){
  const b=bookings.find(x=>x.id===editBkId); if(!b) return null;
  const ci=document.getElementById('eb-ci').value, cit=document.getElementById('eb-ci-t').value;
  const co=document.getElementById('eb-co').value, cot=document.getElementById('eb-co-t').value;
  if(!ci||!cit||!co||!cot) return null;
  const inDt=new Date(ci+'T'+cit), outDt=new Date(co+'T'+cot);
  if(isNaN(inDt)||isNaN(outDt)||outDt<=inDt) return {error:true,inDt,outDt};
  const dog=dogs.find(d=>d.id===(b.entries&&b.entries[0]&&b.entries[0].dogId));
  const res=calcDogSvc(dog,inDt,outDt,b.service);
  const val=parseFloat(document.getElementById('eb-disc-val').value)||0;
  let discount = val<=0?0:(ebDiscType==='pct'?res.total*(val/100):val);
  discount=Math.min(+discount.toFixed(2),res.total);
  return {inDt,outDt,res,discount,discVal:val,total:+(res.total-discount).toFixed(2)};
}
function ebPreview(){
  const prev=document.getElementById('eb-preview');
  const c=ebCompute();
  if(!c){ prev.style.display='none'; return; }
  if(c.error){ prev.style.display='block'; prev.innerHTML='<span style="color:var(--danger)">⚠️ Check-out must be after check-in.</span>'; return; }
  prev.style.display='block';
  prev.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-mid);margin-bottom:3px"><span>${c.res.fullDays}d${c.res.extraHrs>0?' + '+c.res.extraHrs+'h':''} · $${c.res.rate.toFixed(2)}/day</span><span>$${c.res.total.toFixed(2)}</span></div>${c.discount>0?`<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--coral);margin-bottom:3px"><span>Discount${ebDiscType==='pct'?' ('+c.discVal+'%)':''}</span><span>−$${c.discount.toFixed(2)}</span></div>`:''}<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--cream-dark)"><span style="font-size:13px;font-weight:600">New Total</span><span style="font-family:'DM Serif Display',serif;font-size:22px;color:var(--ink)">$${c.total.toFixed(2)}</span></div>`;
}
async function saveEditBooking(){
  const b=bookings.find(x=>x.id===editBkId); if(!b) return;
  const c=ebCompute();
  if(!c||c.error){ toast('Check-out must be after check-in.', true); return; }
  const e0=(b.entries&&b.entries[0])||{};
  const newEntry={...e0, rate:c.res.rate, fullDays:c.res.fullDays, extraHrs:c.res.extraHrs, surcharge:c.res.surcharge, total:c.res.total, subtotal:c.res.total, discount:c.discount, discount_type:ebDiscType, discount_val:c.discVal};
  const upd={ checkin:c.inDt.toISOString(), checkout:c.outDt.toISOString(), grand_total:c.total, entries:[newEntry] };
  setSyncState('busy');
  try{
    await dbUpdateBooking(b.id, upd);
    Object.assign(b, upd);
    if(b.req_id){ const r=requests.find(x=>x.id===b.req_id); if(r){ r.actual_checkin=upd.checkin; r.actual_checkout=upd.checkout; r.final_total=c.total; } }
    setSyncState('ok'); closeEditBooking(); renderHistory(); updateBadges();
    toast('Invoice updated — new total $'+c.total.toFixed(2));
    try{ openInv(b.id); }catch(e){}
  }catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
document.getElementById('editbk-mo').addEventListener('click',function(e){ if(e.target===this) closeEditBooking(); });

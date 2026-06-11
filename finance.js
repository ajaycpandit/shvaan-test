/* ═══════════════════════════════════════
   NOTIFICATIONS
═══════════════════════════════════════ */
function getNotifs(){
  const now=new Date(), notifs=[];
  const td=now.toDateString(), tm=new Date(now); tm.setDate(tm.getDate()+1);
  bookings.forEach(b=>{
    const ci=new Date(b.checkin), co=new Date(b.checkout);
    if(ci.toDateString()===td) notifs.push({type:'checkin',icon:'🏡',title:'Check-in today',sub:(b.entries||[]).map(e=>e.dogName||'').join(', ')+' at '+ci.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})});
    else if(ci.toDateString()===tm.toDateString()) notifs.push({type:'checkin',icon:'📅',title:'Check-in tomorrow',sub:(b.entries||[]).map(e=>e.dogName||'').join(', ')});
    if(co.toDateString()===td) notifs.push({type:'checkout',icon:'👋',title:'Check-out today',sub:(b.entries||[]).map(e=>e.dogName||'').join(', ')+' at '+co.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})});
  });
  const pend=requests.filter(r=>r.status==='pending');
  if(pend.length) notifs.push({type:'req',icon:'📩',title:pend.length+' pending request'+(pend.length>1?'s':''),sub:'Review in Requests'});
  dogs.forEach(d=>{
    [['Rabies',d.vacc_rabies],['DHPP',d.vacc_dhpp],['Bordetella',d.vacc_bordetella]].forEach(([nm,dt])=>{
      if(!dt) return;
      const exp=new Date(dt), diff=Math.ceil((exp-now)/86400000);
      if(diff<0) notifs.push({type:'vacc',icon:'💉',title:d.dog_name+"'s "+nm+' expired',sub:'Update vaccination records',vacc:{dog:d,name:nm,date:dt,diff}});
      else if(diff<=30) notifs.push({type:'vacc',icon:'⚠️',title:d.dog_name+"'s "+nm+' expires in '+diff+'d',sub:'Due '+exp.toLocaleDateString('en-US',{month:'short',day:'numeric'}),vacc:{dog:d,name:nm,date:dt,diff}});
    });
  });
  return notifs;
}
function vaccEmailLink(v){
  const d=v.dog, biz=settings.bizName||'Shvaan Pet Care';
  const to=d.owner_email||'';
  const subj=encodeURIComponent(`${d.dog_name}'s ${v.name} vaccination ${v.diff<0?'has expired':'is expiring soon'}`);
  const expStr=new Date(v.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const body=encodeURIComponent(`Hi ${d.owner_name},\n\nThis is a friendly reminder from ${biz} that ${d.dog_name}'s ${v.name} vaccination ${v.diff<0?'expired on':'is set to expire on'} ${expStr}.\n\nTo keep ${d.dog_name}'s boarding eligibility current, please arrange to update this vaccination and send us the new record at your earliest convenience.\n\nThank you,\n${biz}${settings.bizPhone?'\n'+settings.bizPhone:''}`);
  return `mailto:${to}?subject=${subj}&body=${body}`;
}
function buildNotifPanel(){
  const notifs=getNotifs(), cnt=notifs.length;
  ['nbadge-desk','nbadge-mob'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.style.display=cnt?'':'none'; el.textContent=cnt; } });
  const pend=requests.filter(r=>r.status==='pending').length;
  ['nb-req','bnb-req'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.style.display=pend?'':'none'; el.textContent=pend; } });
  const html=cnt===0?'<div class="notif-empty">🎉 All clear — no alerts!</div>':notifs.map(n=>{
    const emailBtn=n.vacc?`<a href="${vaccEmailLink(n.vacc)}" onclick="event.stopPropagation()" style="display:inline-block;margin-top:5px;font-size:11px;font-weight:600;color:var(--blue);text-decoration:none;border:1px solid #BCCFE8;background:var(--bluep);border-radius:99px;padding:2px 9px">✉️ Email reminder</a>`:'';
    return `<div class="notif-item"><div class="notif-icon ${n.type}">${n.icon}</div><div><div class="notif-title">${esc(n.title)}</div><div class="notif-sub">${esc(n.sub)}</div>${emailBtn}</div></div>`;
  }).join('');
  const panel='<div class="notif-header"><span>Notifications'+(cnt?' ('+cnt+')':'')+'</span><button style="font-size:11px;background:none;border:none;cursor:pointer;color:var(--ink-faint)" onclick="closeNotif()">Close</button></div><div class="notif-list">'+html+'</div>';
  ['notif-panel-desk','notif-panel-mob'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=panel; });
}
function toggleNotif(e){ e.stopPropagation(); notifOpen=!notifOpen; ['notif-panel-desk','notif-panel-mob'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=notifOpen?'block':'none'; }); if(notifOpen) buildNotifPanel(); }
function closeNotif(){ notifOpen=false; ['notif-panel-desk','notif-panel-mob'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; }); }
function updateBadges(){ buildNotifPanel(); }
document.addEventListener('click', e=>{ if(notifOpen && !e.target.closest('.notif-wrap')) closeNotif(); });

/* ═══════════════════════════════════════
   DOGS
═══════════════════════════════════════ */
function handlePhoto(input) {
  const file=input.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=e=>{ pendingPhoto=e.target.result; document.getElementById('ppw').innerHTML=`<img src="${pendingPhoto}" style="width:62px;height:62px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 4px;border:2px solid var(--cream-dark)">`; };
  r.readAsDataURL(file);
}

async function addDog() {
  const name=document.getElementById('nd-name').value.trim(), owner=document.getElementById('nd-owner').value.trim();
  if(!name||!owner) { toast('Dog name and owner name are required.', true); return; }
  const phone=document.getElementById('nd-phone').value.trim();
  const email=document.getElementById('nd-email').value.trim();
  const rate=document.getElementById('nd-rate').value.trim();
  const breed=document.getElementById('nd-breed').value.trim();
  const notes=document.getElementById('nd-notes').value.trim();
  const vR=document.getElementById('nd-v-rabies').value, vD=document.getElementById('nd-v-dhpp').value, vB=document.getElementById('nd-v-bord').value;
  const traits={ temperament:document.getElementById('nd-t-temp').value, social:document.getElementById('nd-t-social').value, energy:document.getElementById('nd-t-energy').value, play:document.getElementById('nd-t-play').value, eating:document.getElementById('nd-t-eat').value, handling:document.getElementById('nd-t-handling').value.trim() };
  const rec = { id:Date.now().toString(), dog_name:name, owner_name:owner, phone:phone||null, owner_email:email||null, rate_override:rate?parseFloat(rate):null, breed:breed||null, notes:notes||null, photo:pendingPhoto||null, vacc_rabies:vR||null, vacc_dhpp:vD||null, vacc_bordetella:vB||null, vacc_file_url:null, traits:traits };
  setSyncState('busy');
  try {
    if(pendingVaccFile){ try{ rec.vacc_file_url = await uploadVaccFile(rec.id, pendingVaccFile); }catch(fe){ console.warn('Vacc upload failed', fe); toast('Dog saved, but vaccine file upload failed (check storage bucket).', true); } }
    await dbInsertDog(rec);
    dogs.push(rec);
    setSyncState('ok');
    ['nd-name','nd-owner','nd-phone','nd-email','nd-rate','nd-breed','nd-notes','nd-v-rabies','nd-v-dhpp','nd-v-bord','nd-t-temp','nd-t-social','nd-t-energy','nd-t-play','nd-t-eat','nd-t-handling'].forEach(id=>document.getElementById(id).value='');
    pendingPhoto=null; pendingVaccFile=null;
    document.getElementById('ppw').innerHTML='<div class="upl">🐶</div><p>Add photo</p>';
    const vb=document.getElementById('vacc-box'); vb.classList.remove('has-file');
    document.getElementById('vacc-box-content').innerHTML='<div style="font-size:20px;margin-bottom:3px">📎</div><div style="font-size:12px;font-weight:600;color:var(--ink-mid)">Click to attach records</div><div style="font-size:11px;color:var(--ink-faint);margin-top:2px">PDF, JPG, PNG — max 5MB</div>';
    renderDogList(); renderDD(); renderReqDD(); updateBadges(); toast(name+' added!');
  } catch(e) { setSyncState('err'); toast('Error: '+e.message, true); }
}

function handleVaccFile(input){
  const file=input.files[0]; if(!file) return;
  if(file.size>5*1024*1024){ toast('File must be under 5MB.', true); input.value=''; return; }
  pendingVaccFile=file;
  document.getElementById('vacc-box').classList.add('has-file');
  document.getElementById('vacc-box-content').innerHTML='<div style="font-size:18px;margin-bottom:3px">✅</div><div style="font-size:12px;font-weight:600;color:var(--forest)">'+esc(file.name)+'</div><div style="font-size:11px;color:var(--ink-faint);margin-top:2px">Click to change</div>';
}

function vaccStatus(dateStr){
  if(!dateStr) return {cls:'none', label:'Not on file'};
  const d=new Date(dateStr), diff=Math.ceil((d-new Date())/86400000);
  if(diff<0) return {cls:'exp', label:'Expired '+d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
  if(diff<=30) return {cls:'warn', label:'Expires '+d.toLocaleDateString('en-US',{month:'short',day:'numeric'})};
  return {cls:'ok', label:'Valid to '+d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
}
function renderVaccStatus(){
  const card=document.getElementById('vacc-status-card');
  if(!card) return;
  const expired=[], soon=[];
  const now=new Date();
  dogs.forEach(d=>{
    const issues=[];
    [['Rabies',d.vacc_rabies],['DHPP',d.vacc_dhpp],['Bordetella',d.vacc_bordetella]].forEach(([nm,dt])=>{
      if(!dt) return;
      const diff=Math.ceil((new Date(dt)-now)/86400000);
      if(diff<0) issues.push({nm,kind:'exp',diff});
      else if(diff<=30) issues.push({nm,kind:'soon',diff});
    });
    if(issues.some(x=>x.kind==='exp')) expired.push({dog:d,issues:issues.filter(x=>x.kind==='exp')});
    if(issues.some(x=>x.kind==='soon')) soon.push({dog:d,issues:issues.filter(x=>x.kind==='soon')});
  });
  if(!expired.length && !soon.length){
    card.innerHTML=`<div class="card" style="border-color:#C5DEC7;background:var(--forest-pale)"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">✅</span><div><div style="font-size:14px;font-weight:600;color:var(--forest)">All vaccinations current</div><div style="font-size:12px;color:var(--forest)">No dogs have expired or soon-to-expire vaccinations.</div></div></div></div>`;
    return;
  }
  const row=(item,kind)=>{
    const d=item.dog;
    const tags=item.issues.map(x=>`<span class="vbdg ${kind==='exp'?'exp':'warn'}">${x.nm} ${kind==='exp'?'expired '+Math.abs(x.diff)+'d ago':'in '+x.diff+'d'}</span>`).join(' ');
    const first=item.issues[0];
    const dateMap={Rabies:d.vacc_rabies,DHPP:d.vacc_dhpp,Bordetella:d.vacc_bordetella};
    const emailHref=d.owner_email?vaccEmailLink({dog:d,name:first.nm,date:dateMap[first.nm],diff:first.diff}):null;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--cream-mid)">
      <div class="da" style="width:34px;height:34px;font-size:15px">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div>
      <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--ink)">${esc(d.dog_name)} <span style="font-weight:400;color:var(--ink-faint)">· ${esc(d.owner_name)}</span></div><div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap">${tags}</div></div>
      ${emailHref?`<a href="${emailHref}" onclick="event.stopPropagation()" class="btn btn-o sm" style="text-decoration:none;flex-shrink:0">✉️ Email</a>`:''}
    </div>`;
  };
  let html='<div class="card" style="border-color:#EAB0AC">';
  html+='<div class="ct" style="color:var(--danger)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Vaccination Alerts</div>';
  if(expired.length){ html+=`<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--danger);margin-bottom:4px">🔴 Expired (${expired.length})</div>`+expired.map(it=>row(it,'exp')).join(''); }
  if(soon.length){ html+=`<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--gold);margin:12px 0 4px">🟡 Expiring within 30 days (${soon.length})</div>`+soon.map(it=>row(it,'soon')).join(''); }
  html+='</div>';
  card.innerHTML=html;
}

async function deleteDog(id) {
  if(!confirm('Remove this dog profile?')) return;
  setSyncState('busy');
  try {
    await dbDeleteDog(id);
    dogs = dogs.filter(d=>d.id!==id); selDogs.delete(id);
    setSyncState('ok'); renderDogList(); renderDD(); renderReqDD(); updateBadges(); toast('Dog removed.');
  } catch(e) { setSyncState('err'); toast('Error: '+e.message, true); }
}

function renderDogList() {
  renderVaccStatus();
  const c=document.getElementById('dog-list-wrap');
  if(!dogs.length) { c.innerHTML='<div class="es"><span class="ei">🐕</span><p>No dogs added yet.</p></div>'; document.getElementById('dog-count').textContent=''; return; }
  const q=(document.getElementById('dog-search')?.value||'').toLowerCase().trim();
  const filtered=dogs.filter(d=>!q||(d.dog_name||'').toLowerCase().includes(q)||(d.owner_name||'').toLowerCase().includes(q)||(d.breed||'').toLowerCase().includes(q));
  const cntEl=document.getElementById('dog-count');
  cntEl.textContent=q?filtered.length+' of '+dogs.length+' dogs':dogs.length+' dog'+(dogs.length!==1?'s':'');
  if(!filtered.length){ c.innerHTML='<div class="es"><span class="ei">🔍</span><p>No dogs match "'+esc(q)+'"</p></div>'; return; }
  const sorted=[...filtered].sort((a,b)=>(a.dog_name||'').localeCompare(b.dog_name||''));
  if(dogViewMode==='list'){
    c.innerHTML='<div style="display:flex;flex-direction:column;gap:1px;border:1px solid var(--cream-dark);border-radius:var(--r3);overflow:hidden">'+sorted.map(d=>{
      const flags=visitNotes.filter(n=>n.dog_id===d.id&&n.flagged).length;
      const anyExp=[d.vacc_rabies,d.vacc_dhpp,d.vacc_bordetella].some(v=>v&&new Date(v)<new Date());
      return `<div onclick="openDogHistory('${d.id}')" style="display:flex;align-items:center;gap:11px;padding:10px 13px;border-bottom:1px solid var(--cream-mid);cursor:pointer;background:var(--white)">
        <div class="da" style="width:38px;height:38px;font-size:16px">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div>
        <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:var(--ink)">${esc(d.dog_name)}${anyExp?' <span style="font-size:10px;color:var(--danger)">💉 vacc due</span>':''}${flags?' <span style="font-size:10px;color:var(--coral)">⚠️ '+flags+'</span>':''}</div><div style="font-size:12px;color:var(--ink-faint)">${esc(d.owner_name)}${d.breed?' · '+esc(d.breed):''}</div></div>
        <button class="btn btn-o sm" onclick="event.stopPropagation();openDogProfile('${d.id}')">Edit</button>
      </div>`;
    }).join('')+'</div>';
    return;
  }
  c.innerHTML='<div class="dog-list">'+sorted.map(d=>{
    const rv=vaccStatus(d.vacc_rabies), dv=vaccStatus(d.vacc_dhpp), bv=vaccStatus(d.vacc_bordetella);
    return `
    <div class="di">
      <div class="da">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div>
      <div style="flex:1;min-width:0">
        <div class="dname">${esc(d.dog_name)}${d.breed?` <span style="font-size:11px;font-weight:400;color:var(--ink-faint)">· ${esc(d.breed)}</span>`:''}</div>
        <div class="downer">${esc(d.owner_name)}</div>
        <div class="dmeta">
          ${d.phone?`<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.21 3.39 2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>${esc(d.phone)}</span>`:''}
          <span>💰 ${d.rate_override!=null?'$'+parseFloat(d.rate_override).toFixed(2)+'/day':'Default rate'}</span>
          ${d.owner_email?`<span>✉️ ${esc(d.owner_email)}</span>`:''}
          ${d.notes?`<span>📋 ${esc(d.notes)}</span>`:''}
        </div>
        <div class="vacc-row">
          <span class="vbdg ${rv.cls}">💉 Rabies: ${rv.label}</span>
          <span class="vbdg ${dv.cls}">💉 DHPP: ${dv.label}</span>
          <span class="vbdg ${bv.cls}">💉 Bordetella: ${bv.label}</span>
          ${d.vacc_file_url?`<a href="${d.vacc_file_url}" target="_blank" class="vbdg ok" style="text-decoration:none;cursor:pointer">📎 View Records</a>`:''}
        </div>
        ${traitChips(d)}
      </div>
      <div class="dia" style="flex-direction:column;gap:6px">
        <button class="btn btn-o sm" onclick="openDogProfile('${d.id}')" style="width:100%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit
        </button>
        <button class="btn btn-o sm" onclick="openDogHistory('${d.id}')" style="width:100%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>History
        </button>
        <button class="btn btn-d sm" onclick="deleteDog('${d.id}')" style="width:100%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>Remove
        </button>
      </div>
    </div>`;
  }).join('')+'</div>';
}
let dogViewMode='card';
function setDogView(m){ dogViewMode=m; document.getElementById('dogview-card').classList.toggle('active',m==='card'); document.getElementById('dogview-list').classList.toggle('active',m==='list'); renderDogList(); }

/* ═══════════════════════════════════════
   BREED SEARCH
═══════════════════════════════════════ */
const BREEDS=['Affenpinscher','Afghan Hound','Airedale Terrier','Akita','Alaskan Malamute','American Bulldog','American Eskimo Dog','American Pitbull Terrier','American Staffordshire Terrier','Anatolian Shepherd','Australian Cattle Dog','Australian Shepherd','Australian Terrier','Basenji','Basset Hound','Beagle','Bearded Collie','Belgian Malinois','Belgian Sheepdog','Belgian Tervuren','Bernese Mountain Dog','Bichon Frise','Border Collie','Border Terrier','Borzoi','Boston Terrier','Boxer','Brittany','Brussels Griffon','Bull Terrier','Bulldog','Bullmastiff','Cairn Terrier','Cane Corso','Cardigan Welsh Corgi','Cavalier King Charles Spaniel','Chesapeake Bay Retriever','Chihuahua','Chinese Crested','Chinese Shar-Pei','Chow Chow','Cocker Spaniel','Collie','Dachshund','Dalmatian','Doberman Pinscher','French Bulldog','German Shepherd','German Shorthaired Pointer','Golden Retriever','Great Dane','Great Pyrenees','Greyhound','Havanese','Irish Setter','Italian Greyhound','Jack Russell Terrier','Labrador Retriever','Lhasa Apso','Maltese','Mastiff','Miniature Pinscher','Miniature Schnauzer','Mixed Breed','Newfoundland','Old English Sheepdog','Papillon','Pekingese','Pembroke Welsh Corgi','Pomeranian','Poodle (Miniature)','Poodle (Standard)','Poodle (Toy)','Portuguese Water Dog','Pug','Rhodesian Ridgeback','Rottweiler','Saint Bernard','Samoyed','Scottish Terrier','Shetland Sheepdog','Shiba Inu','Shih Tzu','Siberian Husky','Staffordshire Bull Terrier','Vizsla','Weimaraner','West Highland White Terrier','Whippet','Yorkshire Terrier'];
let breedFocusIdx=-1;
function filterBreeds(inp, ddId='breed-dd'){
  const q=inp.value.toLowerCase().trim(), dd=document.getElementById(ddId);
  breedFocusIdx=-1;
  if(!q){ dd.style.display='none'; return; }
  const m=BREEDS.filter(b=>b.toLowerCase().includes(q)).slice(0,10);
  if(!m.length){ dd.style.display='none'; return; }
  const targetInput = ddId==='e-breed-dd' ? 'e-breed' : 'nd-breed';
  dd.innerHTML=m.map((b,i)=>`<div class="breed-opt" data-idx="${i}" onclick="selectBreed('${esc(b).replace(/'/g,"\\'")}','${targetInput}','${ddId}')">${esc(b)}</div>`).join('');
  dd.style.display='block';
}
function selectBreed(b, inputId='nd-breed', ddId='breed-dd'){ document.getElementById(inputId).value=b; document.getElementById(ddId).style.display='none'; breedFocusIdx=-1; }
function breedKey(e, ddId='breed-dd', inputId='nd-breed'){
  const dd=document.getElementById(ddId), opts=dd.querySelectorAll('.breed-opt');
  if(!opts.length) return;
  if(e.key==='ArrowDown'){ e.preventDefault(); breedFocusIdx=Math.min(breedFocusIdx+1,opts.length-1); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); breedFocusIdx=Math.max(breedFocusIdx-1,0); }
  else if(e.key==='Enter'&&breedFocusIdx>=0){ e.preventDefault(); opts[breedFocusIdx].click(); return; }
  else if(e.key==='Escape'){ dd.style.display='none'; return; }
  opts.forEach((o,i)=>o.classList.toggle('focused',i===breedFocusIdx));
  if(breedFocusIdx>=0) opts[breedFocusIdx].scrollIntoView({block:'nearest'});
}

/* ═══════════════════════════════════════
   EDIT DOG + DOG HISTORY
═══════════════════════════════════════ */
let editingDogId=null, editPendingPhoto=null, editPendingVaccFile=null;
function openDogProfile(id){
  const d=dogs.find(x=>x.id===id); if(!d) return;
  editingDogId=id; editPendingPhoto=null; editPendingVaccFile=null;
  document.getElementById('e-name').value=d.dog_name||'';
  document.getElementById('e-owner').value=d.owner_name||'';
  document.getElementById('e-phone').value=d.phone||'';
  document.getElementById('e-email').value=d.owner_email||'';
  document.getElementById('e-rate').value=d.rate_override!=null?d.rate_override:'';
  document.getElementById('e-breed').value=d.breed||'';
  document.getElementById('e-notes').value=d.notes||'';
  document.getElementById('e-v-rabies').value=d.vacc_rabies||'';
  document.getElementById('e-v-dhpp').value=d.vacc_dhpp||'';
  document.getElementById('e-v-bord').value=d.vacc_bordetella||'';
  const tr=d.traits||{};
  document.getElementById('e-t-temp').value=tr.temperament||'';
  document.getElementById('e-t-social').value=tr.social||'';
  document.getElementById('e-t-energy').value=tr.energy||'';
  document.getElementById('e-t-play').value=tr.play||'';
  document.getElementById('e-t-eat').value=tr.eating||'';
  document.getElementById('e-t-handling').value=tr.handling||'';
  document.getElementById('e-ppw').innerHTML=d.photo?`<img src="${d.photo}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 4px;border:2px solid var(--cream-dark)">`:'<div class="upl">🐶</div><p>Add photo</p>';
  const vb=document.getElementById('e-vacc-box'); vb.classList.toggle('has-file',!!d.vacc_file_url);
  document.getElementById('e-vacc-box-content').innerHTML=d.vacc_file_url?'<div style="font-size:18px;margin-bottom:3px">✅</div><div style="font-size:12px;font-weight:600;color:var(--forest)">Records on file</div><div style="font-size:11px;color:var(--ink-faint);margin-top:2px">Click to replace</div>':'<div style="font-size:20px;margin-bottom:3px">📎</div><div style="font-size:12px;font-weight:600;color:var(--ink-mid)">Click to attach</div>';
  document.getElementById('edit-mo').classList.add('on');
}
function closeEditMo(){ document.getElementById('edit-mo').classList.remove('on'); editingDogId=null; }
function handleEditPhoto(input){ const f=input.files[0]; if(!f)return; const r=new FileReader(); r.onload=e=>{ editPendingPhoto=e.target.result; document.getElementById('e-ppw').innerHTML=`<img src="${editPendingPhoto}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 4px;border:2px solid var(--cream-dark)">`; }; r.readAsDataURL(f); }
function handleEditVaccFile(input){ const f=input.files[0]; if(!f)return; if(f.size>5*1024*1024){toast('File must be under 5MB.',true);input.value='';return;} editPendingVaccFile=f; document.getElementById('e-vacc-box').classList.add('has-file'); document.getElementById('e-vacc-box-content').innerHTML='<div style="font-size:18px;margin-bottom:3px">✅</div><div style="font-size:12px;font-weight:600;color:var(--forest)">'+esc(f.name)+'</div><div style="font-size:11px;color:var(--ink-faint);margin-top:2px">Click to change</div>'; }
async function saveEditDog(){
  if(!editingDogId) return;
  const name=document.getElementById('e-name').value.trim(), owner=document.getElementById('e-owner').value.trim();
  if(!name||!owner){ toast('Dog name and owner name are required.', true); return; }
  const upd={
    dog_name:name, owner_name:owner,
    phone:document.getElementById('e-phone').value.trim()||null,
    owner_email:document.getElementById('e-email').value.trim()||null,
    rate_override:document.getElementById('e-rate').value.trim()?parseFloat(document.getElementById('e-rate').value):null,
    breed:document.getElementById('e-breed').value.trim()||null,
    notes:document.getElementById('e-notes').value.trim()||null,
    vacc_rabies:document.getElementById('e-v-rabies').value||null,
    vacc_dhpp:document.getElementById('e-v-dhpp').value||null,
    vacc_bordetella:document.getElementById('e-v-bord').value||null,
    traits:{ temperament:document.getElementById('e-t-temp').value, social:document.getElementById('e-t-social').value, energy:document.getElementById('e-t-energy').value, play:document.getElementById('e-t-play').value, eating:document.getElementById('e-t-eat').value, handling:document.getElementById('e-t-handling').value.trim() }
  };
  if(editPendingPhoto) upd.photo=editPendingPhoto;
  setSyncState('busy');
  try{
    if(editPendingVaccFile){ try{ upd.vacc_file_url=await uploadVaccFile(editingDogId, editPendingVaccFile); }catch(fe){ console.warn(fe); toast('Saved, but vaccine file upload failed.', true); } }
    await dbUpdateDog(editingDogId, upd);
    const d=dogs.find(x=>x.id===editingDogId); if(d) Object.assign(d, upd);
    setSyncState('ok');
    closeEditMo(); renderDogList(); renderDD(); renderReqDD(); updateBadges(); toast('Profile updated!');
  }catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
let dogHistId=null;
function openDogHistory(id){
  const d=dogs.find(x=>x.id===id); if(!d) return;
  dogHistId=id;
  document.getElementById('doghist-title').textContent=d.dog_name;
  renderDogHistBody();
  document.getElementById('doghist-mo').classList.add('on');
}
function renderDogHistBody(){
  const d=dogs.find(x=>x.id===dogHistId); if(!d) return;
  const body=document.getElementById('doghist-body');
  const fd=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const ft=s=>new Date(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  // Traits summary
  let html=traitChips(d,true);
  // Visit notes section
  const notes=visitNotes.filter(n=>n.dog_id===d.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  html+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);margin:16px 0 8px;display:flex;justify-content:space-between;align-items:center"><span>📝 Visit Notes & Observations</span></div>';
  // quick add
  html+=`<div style="background:var(--cream-mid);border:1px solid var(--cream-dark);border-radius:var(--radius-md);padding:11px;margin-bottom:12px">
    <div style="display:flex;gap:7px;margin-bottom:7px;flex-wrap:wrap">
      <select id="note-cat" style="flex:1;min-width:120px;height:38px;padding:0 10px;border:1.5px solid var(--cream-dark);border-radius:var(--r2);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--white);outline:none"><option>General</option><option>Feeding</option><option>Behavior</option><option>Health</option><option>Social</option></select>
      <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-mid);white-space:nowrap;cursor:pointer"><input type="checkbox" id="note-flag" style="width:16px;height:16px;accent-color:var(--danger)">⚠️ Flag for next visit</label>
    </div>
    <textarea id="note-text" placeholder="What happened? e.g. Wouldn't eat first night; great with the small dogs in group play…" style="width:100%;height:54px;padding:9px 11px;border:1.5px solid var(--cream-dark);border-radius:var(--r2);font-size:14px;font-family:'DM Sans',sans-serif;resize:vertical;outline:none;background:var(--white);margin-bottom:7px"></textarea>
    <button class="btn btn-p sm" onclick="addVisitNote()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Note</button>
  </div>`;
  if(notes.length){
    // flagged first
    const flagged=notes.filter(n=>n.flagged), rest=notes.filter(n=>!n.flagged);
    html+=[...flagged,...rest].map(n=>noteRow(n)).join('');
  } else {
    html+='<div style="font-size:12px;color:var(--ink-faint);padding:4px 0 12px">No notes logged yet.</div>';
  }
  // Reservations
  const recs=bookings.filter(b=>(b.entries||[]).some(e=>e.dogId===d.id||e.dogName===d.dog_name));
  html+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);margin:16px 0 8px">📋 Past Reservations</div>';
  if(recs.length){
    html+=recs.map(b=>{
      const ent=(b.entries||[]).find(e=>e.dogId===d.id||e.dogName===d.dog_name)||{};
      return `<div style="background:var(--cream-mid);border:1px solid var(--cream-dark);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:9px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px"><div>${b.service==='boarding'?'<span class="sp sp-b">🏡 Boarding</span>':'<span class="sp sp-d">☀️ Day Care</span>'}</div><div style="font-family:'DM Serif Display',serif;font-size:16px;color:var(--ink)">$${ent.total!=null?parseFloat(ent.total).toFixed(2):parseFloat(b.grand_total).toFixed(2)}</div></div>
        <div style="font-size:12px;color:var(--ink-light);margin-bottom:7px">${fd(b.checkin)} ${ft(b.checkin)} → ${fd(b.checkout)} ${ft(b.checkout)}</div>
        <button class="btn btn-g sm" onclick="closeDogHistory();openInv('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>View Invoice</button>
      </div>`;
    }).join('');
  } else { html+='<div style="font-size:12px;color:var(--ink-faint)">No past reservations yet.</div>'; }
  body.innerHTML=html;
}
function noteRow(n){
  const dt=new Date(n.created_at);
  const catColor={Feeding:'var(--gold-pale)',Behavior:'#FCEEEA',Health:'var(--danger-pale)',Social:'#E6F2F0',General:'var(--cream-mid)'}[n.category]||'var(--cream-mid)';
  return `<div style="border:1px solid ${n.flagged?'#EAB0AC':'var(--cream-dark)'};border-radius:var(--radius-md);padding:10px 12px;margin-bottom:7px;background:${n.flagged?'var(--danger-pale)':'var(--white)'}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:3px">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;background:${catColor};color:var(--ink-mid)">${esc(n.category)}</span>${n.flagged?'<span style="font-size:10px;font-weight:600;color:var(--danger)">⚠️ Flagged</span>':''}</div>
      <button onclick="delVisitNote('${n.id}')" style="background:none;border:none;cursor:pointer;color:var(--ink-faint);font-size:14px;line-height:1;flex-shrink:0">×</button>
    </div>
    <div style="font-size:13px;color:var(--ink);line-height:1.45">${esc(n.note)}</div>
    <div style="font-size:11px;color:var(--ink-faint);margin-top:4px">${dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} · ${esc(n.staff||'Staff')}${n.flagged?` · <a onclick="toggleFlag('${n.id}')" style="cursor:pointer;color:var(--brown);text-decoration:underline">unflag</a>`:` · <a onclick="toggleFlag('${n.id}')" style="cursor:pointer;color:var(--brown);text-decoration:underline">flag</a>`}</div>
  </div>`;
}
function getStaffName(){
  if(staffName) return staffName;
  const n=prompt('Your name (so notes show who logged them):','');
  if(n&&n.trim()){ staffName=n.trim(); localStorage.setItem('shvaan_staff',staffName); }
  return staffName||'Staff';
}
async function addVisitNote(){
  const d=dogs.find(x=>x.id===dogHistId); if(!d) return;
  const text=document.getElementById('note-text').value.trim();
  if(!text){ toast('Please write a note first.', true); return; }
  const staff=getStaffName();
  const note={ id:Date.now().toString()+Math.random().toString(36).slice(2), dog_id:d.id, dog_name:d.dog_name, category:document.getElementById('note-cat').value, note:text, flagged:document.getElementById('note-flag').checked, staff:staff, created_at:new Date().toISOString() };
  setSyncState('busy');
  try{ await dbAddNote(note); visitNotes.unshift(note); setSyncState('ok'); renderDogHistBody(); renderDogList(); toast('Note added.'); }
  catch(e){ setSyncState('err'); toast('Could not save note: '+e.message+' (did you create the visit_notes table?)', true); }
}
async function delVisitNote(id){
  if(!confirm('Delete this note?')) return;
  setSyncState('busy');
  try{ await dbDelNote(id); visitNotes=visitNotes.filter(n=>n.id!==id); setSyncState('ok'); renderDogHistBody(); renderDogList(); toast('Note deleted.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
async function toggleFlag(id){
  const n=visitNotes.find(x=>x.id===id); if(!n) return;
  n.flagged=!n.flagged;
  setSyncState('busy');
  try{ await dbUpdNote(id,{flagged:n.flagged}); setSyncState('ok'); renderDogHistBody(); }
  catch(e){ setSyncState('err'); }
}
/* Trait chips: compact=false shows full row incl handling notes */
function traitChips(d, full){
  const t=d.traits||{};
  const flagCount=visitNotes.filter(n=>n.dog_id===d.id&&n.flagged).length;
  const map=[
    ['temperament',{Calm:'🟢',Friendly:'🟢',Shy:'🟡',Anxious:'🟡',Reactive:'🔴'}],
    ['social',{Yes:'🟢',Selective:'🟡',No:'🔴',Unknown:'⚪'}],
    ['energy',{Low:'',Moderate:'',High:''}],
    ['play',{}],['eating',{Picky:'🟡','Needs encouragement':'🟡','Special diet':'🟡','Good eater':'🟢'}]
  ];
  const labels={temperament:'',social:'🐕 ',energy:'⚡ ',play:'🎾 ',eating:'🍽️ '};
  const chips=[];
  if(t.temperament) chips.push(`<span class="vbdg none">${(map[0][1][t.temperament]||'')} ${t.temperament}</span>`);
  if(t.social) chips.push(`<span class="vbdg none">🐕 ${t.social==='Yes'?'Good w/ dogs':t.social==='No'?'Not w/ dogs':t.social} </span>`);
  if(t.energy) chips.push(`<span class="vbdg none">⚡ ${t.energy} energy</span>`);
  if(t.play) chips.push(`<span class="vbdg none">🎾 ${t.play} play</span>`);
  if(t.eating) chips.push(`<span class="vbdg none">🍽️ ${t.eating}</span>`);
  if(flagCount) chips.unshift(`<span class="vbdg exp">⚠️ ${flagCount} flagged note${flagCount!==1?'s':''}</span>`);
  if(!chips.length && !(t.handling&&full)) return full?'<div style="font-size:12px;color:var(--ink-faint)">No behavior info logged yet.</div>':'';
  let html=`<div class="vacc-row" style="margin-top:5px">${chips.join('')}</div>`;
  if(full && t.handling) html+=`<div style="font-size:12px;color:var(--ink-light);margin-top:7px;line-height:1.4">📌 ${esc(t.handling)}</div>`;
  return html;
}
function closeDogHistory(){ document.getElementById('doghist-mo').classList.remove('on'); dogHistId=null; }
document.getElementById('edit-mo').addEventListener('click',function(e){ if(e.target===this) closeEditMo(); });
document.getElementById('doghist-mo').addEventListener('click',function(e){ if(e.target===this) closeDogHistory(); });
document.getElementById('cio-mo').addEventListener('click',function(e){ if(e.target===this) closeCio(); });
document.getElementById('editreq-mo').addEventListener('click',function(e){ if(e.target===this) closeEditReq(); });

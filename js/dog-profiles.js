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
      return `<div onclick="openDogDrawer('${d.id}')" style="display:flex;align-items:center;gap:11px;padding:10px 13px;border-bottom:1px solid var(--cream-mid);cursor:pointer;background:var(--white)">
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
        <button class="btn btn-o sm" onclick="openDogDrawer('${d.id}')" style="width:100%">
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
  // ── Rate change history ──────────────────────────────────────
  const existing=dogs.find(x=>x.id===editingDogId);
  const oldRate=existing?existing.rate_override:null;
  const newRate=upd.rate_override;
  const rateChanged=(oldRate!==newRate)&&!(oldRate==null&&newRate==null);
  // ────────────────────────────────────────────────────────────
  setSyncState('busy');
  try{
    if(editPendingVaccFile){ try{ upd.vacc_file_url=await uploadVaccFile(editingDogId, editPendingVaccFile); }catch(fe){ console.warn(fe); toast('Saved, but vaccine file upload failed.', true); } }
    await dbUpdateDog(editingDogId, upd);
    // Log rate change to visit_notes
    if(rateChanged){
      const oldFmt=oldRate!=null?'$'+parseFloat(oldRate).toFixed(2)+'/night':'default rate';
      const newFmt=newRate!=null?'$'+parseFloat(newRate).toFixed(2)+'/night':'default rate';
      const noteText=`Rate changed: ${oldFmt} → ${newFmt}`;
      await dbAddNote({
        id: Date.now().toString()+Math.random().toString(36).slice(2,6),
        dog_id: editingDogId,
        dog_name: name,
        note: noteText,
        note_type: 'rate_change',
        old_rate: oldRate,
        new_rate: newRate,
        created_by: currentUser?currentUser.email:'unknown',
        created_at: new Date().toISOString()
      }).catch(()=>{}); // non-blocking — don't fail the save if note fails
    }
    const d=dogs.find(x=>x.id===editingDogId); if(d) Object.assign(d, upd);
    setSyncState('ok');
    closeEditMo(); renderDogList(); renderDD(); renderReqDD(); updateBadges();
    toast(rateChanged?'Profile updated with rate change logged!':'Profile updated!');
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
  // Rate change entries get a distinct visual treatment
  if(n.note_type==='rate_change'){
    const dt=new Date(n.created_at);
    const oldFmt=n.old_rate!=null?'$'+parseFloat(n.old_rate).toFixed(2):' default';
    const newFmt=n.new_rate!=null?'$'+parseFloat(n.new_rate).toFixed(2):' default';
    const isUp=n.new_rate!=null&&(n.old_rate==null||n.new_rate>n.old_rate);
    const isDn=n.new_rate!=null&&n.old_rate!=null&&n.new_rate<n.old_rate;
    const arrow=isUp?'↑':isDn?'↓':'↔';
    const arrowColor=isUp?'var(--forest)':isDn?'var(--danger)':'var(--ink-light)';
    return `<div style="border:1px solid var(--cream-dark);border-radius:var(--radius-md);padding:10px 12px;margin-bottom:7px;background:var(--cream-mid)">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--forest-pale);color:var(--forest)">💰 Rate Change</span>
        <span style="font-size:13px;font-weight:600;color:${arrowColor}">${arrow} ${oldFmt} → ${newFmt}/night</span>
      </div>
      <div style="font-size:11px;color:var(--ink-faint);margin-top:3px">${dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} at ${dt.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})} · ${esc(n.created_by||'Staff')}</div>
    </div>`;
  }
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
  try{ await dbAddNote(note); visitNotes.unshift(note); setSyncState('ok'); renderDogHistBody(); renderDogList(); refreshDogPanels(); toast('Note added.'); }
  catch(e){ setSyncState('err'); toast('Could not save note: '+e.message+' (did you create the visit_notes table?)', true); }
}
async function delVisitNote(id){
  if(!confirm('Delete this note?')) return;
  setSyncState('busy');
  try{ await dbDelNote(id); visitNotes=visitNotes.filter(n=>n.id!==id); setSyncState('ok'); renderDogHistBody(); renderDogList(); refreshDogPanels(); toast('Note deleted.'); }
  catch(e){ setSyncState('err'); toast('Error: '+e.message, true); }
}
async function toggleFlag(id){
  const n=visitNotes.find(x=>x.id===id); if(!n) return;
  n.flagged=!n.flagged;
  setSyncState('busy');
  try{ await dbUpdNote(id,{flagged:n.flagged}); setSyncState('ok'); renderDogHistBody(); refreshDogPanels(); }
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

/* ═══════════════════════════════════════
   DOG DRAWER + FULL PROFILE
═══════════════════════════════════════ */
let activeDogId = null;
let ddActiveTab = 'overview';
let dfActiveTab = 'overview';

// ── Shared helpers ─────────────────────
function dogStats(d) {
  const recs = bookings.filter(b=>(b.entries||[]).some(e=>e.dogId===d.id||e.dogName===d.dog_name));
  const nights = recs.reduce((s,b)=>{
    try{ return s+Math.round((new Date(b.checkout)-new Date(b.checkin))/86400000); }catch(e){ return s; }
  }, 0);
  const spend = recs.reduce((s,b)=>{
    const ent=(b.entries||[]).find(e=>e.dogId===d.id||e.dogName===d.dog_name)||{};
    return s+parseFloat(ent.total||b.grand_total||0);
  }, 0);
  const flagged = visitNotes.filter(n=>n.dog_id===d.id&&n.flagged).length;
  return { stays:recs.length, nights, spend, flagged };
}

function dogVaccBadge(d) {
  const now = new Date(); const soon = 30*24*3600*1000;
  const dates = [d.vacc_rabies, d.vacc_dhpp, d.vacc_bordetella].filter(Boolean).map(v=>new Date(v));
  if(!dates.length) return { cls:'warn', label:'No vacc records' };
  if(dates.some(v=>v<now)) return { cls:'exp', label:'Vacc overdue' };
  if(dates.some(v=>v-now<soon)) return { cls:'soon', label:'Vacc due soon' };
  return { cls:'ok', label:'Vacc current' };
}

// ── Tab content renderers ──────────────
function renderDogTabContent(d, tab, targetEl) {
  const fd = s => new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const ft = s => new Date(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
  const recs = bookings.filter(b=>(b.entries||[]).some(e=>e.dogId===d.id||e.dogName===d.dog_name))
    .sort((a,b)=>new Date(b.checkin)-new Date(a.checkin));
  const notes = visitNotes.filter(n=>n.dog_id===d.id&&n.note_type!=='rate_change')
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const rateNotes = visitNotes.filter(n=>n.dog_id===d.id&&n.note_type==='rate_change')
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const stats = dogStats(d);

  let html = '';
  if(tab === 'overview') {
    html += `<div class="dd-stat-row">
      <div class="dd-stat"><div class="dd-stat-n">${stats.stays}</div><div class="dd-stat-l">Total stays</div></div>
      <div class="dd-stat"><div class="dd-stat-n">${stats.nights}</div><div class="dd-stat-l">Nights</div></div>
      <div class="dd-stat"><div class="dd-stat-n">$${stats.spend.toFixed(0)}</div><div class="dd-stat-l">Lifetime</div></div>
      <div class="dd-stat"><div class="dd-stat-n">${stats.flagged}</div><div class="dd-stat-l">Flagged</div></div>
    </div>`;
    // Upcoming
    const upcoming = requests.filter(r=>r.status==='confirmed'&&(r.dog_id===d.id||r.dog_name===d.dog_name));
    if(upcoming.length) {
      html += `<div class="dd-sec">Upcoming stays</div>`;
      html += upcoming.map(r=>`<div class="dd-row"><div><div style="font-size:12px;font-weight:600">${fd(r.checkin)} → ${fd(r.checkout)}</div><div style="font-size:10px;color:var(--ink-faint)">${r.service==='boarding'?'🏡 Boarding':'☀️ Day Care'}</div></div><span class="sp ${r.service==='boarding'?'sp-b':'sp-d'}">Confirmed</span></div>`).join('');
    }
    // Recent notes
    const recentNotes = notes.slice(0,3);
    html += `<div class="dd-sec">Recent notes</div>`;
    if(recentNotes.length) {
      html += recentNotes.map(n=>{
        const cat = n.category||'General';
        const catColor={Feeding:'var(--gold-pale)',Behavior:'#FCEEEA',Health:'var(--danger-pale)',Social:'#E6F2F0',General:'var(--cream-mid)'}[cat]||'var(--cream-mid)';
        return `<div class="dd-note">${n.flagged?'<span style="font-size:10px;color:var(--danger);font-weight:700">⚠️ Flagged</span> ':''}<span style="font-size:10px;font-weight:600;padding:1px 6px;border-radius:99px;background:${catColor};color:var(--ink-mid)">${esc(cat)}</span> <span style="margin-left:4px">${esc(n.note)}</span><div style="font-size:10px;color:var(--ink-faint);margin-top:3px">${fd(n.created_at)} · ${esc(n.staff||n.created_by||'Staff')}</div></div>`;
      }).join('');
    } else { html += `<div style="font-size:12px;color:var(--ink-faint);padding:4px 0">No notes yet.</div>`; }
    // Last stay
    if(recs.length) {
      const last = recs[0];
      const ent = (last.entries||[]).find(e=>e.dogId===d.id||e.dogName===d.dog_name)||{};
      html += `<div class="dd-sec">Last stay</div><div class="dd-row"><div><div style="font-size:12px;font-weight:600">${fd(last.checkin)} → ${fd(last.checkout)}</div><div style="font-size:10px;color:var(--ink-faint)">${last.service==='boarding'?'🏡 Boarding':'☀️ Day Care'}</div></div><div style="font-size:14px;font-weight:700;color:var(--ink)">$${parseFloat(ent.total||last.grand_total||0).toFixed(2)}</div></div>`;
    }
  }

  else if(tab === 'notes') {
    html += `<div style="background:var(--cream-mid);border:1px solid var(--cream-dark);border-radius:var(--r2);padding:11px;margin-bottom:12px">
      <div style="display:flex;gap:7px;margin-bottom:7px;flex-wrap:wrap">
        <select id="note-cat" style="flex:1;min-width:110px;height:36px;padding:0 10px;border:1.5px solid var(--cream-dark);border-radius:var(--r2);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--white)"><option>General</option><option>Feeding</option><option>Behavior</option><option>Health</option><option>Social</option></select>
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-mid);cursor:pointer"><input type="checkbox" id="note-flag" style="width:15px;height:15px;accent-color:var(--danger)">⚠️ Flag</label>
      </div>
      <textarea id="note-text" placeholder="Add a note…" style="width:100%;height:52px;padding:8px 10px;border:1.5px solid var(--cream-dark);border-radius:var(--r2);font-size:13px;font-family:'DM Sans',sans-serif;resize:vertical;background:var(--white);margin-bottom:7px"></textarea>
      <button class="btn btn-p sm" onclick="addVisitNote()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Note</button>
    </div>`;
    const flagged = notes.filter(n=>n.flagged), rest = notes.filter(n=>!n.flagged);
    const allNotes = [...flagged,...rest];
    if(allNotes.length) html += allNotes.map(n=>noteRow(n)).join('');
    else html += `<div style="font-size:12px;color:var(--ink-faint);padding:4px 0">No notes yet.</div>`;
  }

  else if(tab === 'reservations') {
    if(recs.length) {
      html += recs.map(b=>{
        const ent=(b.entries||[]).find(e=>e.dogId===d.id||e.dogName===d.dog_name)||{};
        return `<div style="background:var(--cream-mid);border:1px solid var(--cream-dark);border-radius:var(--r2);padding:11px 13px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <span class="sp ${b.service==='boarding'?'sp-b':'sp-d'}">${b.service==='boarding'?'🏡 Boarding':'☀️ Day Care'}</span>
            <span style="font-family:'DM Serif Display',serif;font-size:15px;color:var(--ink)">$${parseFloat(ent.total||b.grand_total||0).toFixed(2)}</span>
          </div>
          <div style="font-size:12px;color:var(--ink-light);margin-bottom:6px">${fd(b.checkin)} ${ft(b.checkin)} → ${fd(b.checkout)} ${ft(b.checkout)}</div>
          <button class="btn btn-g sm" onclick="closeDogDrawer();closeDogFull();openInv('${b.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>View Invoice</button>
        </div>`;
      }).join('');
    } else html += `<div style="font-size:12px;color:var(--ink-faint)">No past reservations yet.</div>`;
  }

  else if(tab === 'invoices') {
    const paid = recs.filter(b=>b.paid), unpaid = recs.filter(b=>!b.paid);
    if(!recs.length) { html += `<div style="font-size:12px;color:var(--ink-faint)">No invoices yet.</div>`; }
    else {
      if(unpaid.length) {
        html += `<div class="dd-sec">Unpaid</div>`;
        html += unpaid.map(b=>{
          const ent=(b.entries||[]).find(e=>e.dogId===d.id||e.dogName===d.dog_name)||{};
          return `<div class="dd-row"><div><div style="font-size:12px;font-weight:600">${fd(b.checkin)} – ${fd(b.checkout)}</div><div style="font-size:10px;color:var(--ink-faint)">${b.service==='boarding'?'Boarding':'Day Care'}</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:13px;font-weight:700;color:var(--danger)">$${parseFloat(ent.total||b.grand_total||0).toFixed(2)}</span><button class="btn btn-o sm" onclick="closeDogDrawer();closeDogFull();openInv('${b.id}')">View</button></div></div>`;
        }).join('');
      }
      if(paid.length) {
        html += `<div class="dd-sec">Paid</div>`;
        html += paid.map(b=>{
          const ent=(b.entries||[]).find(e=>e.dogId===d.id||e.dogName===d.dog_name)||{};
          return `<div class="dd-row"><div><div style="font-size:12px;font-weight:600">${fd(b.checkin)} – ${fd(b.checkout)}</div><div style="font-size:10px;color:var(--ink-faint)">${b.payment_method||'Paid'}</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:13px;font-weight:600;color:var(--forest)">$${parseFloat(ent.total||b.grand_total||0).toFixed(2)}</span><button class="btn btn-o sm" onclick="closeDogDrawer();closeDogFull();openInv('${b.id}')">View</button></div></div>`;
        }).join('');
      }
    }
  }

  else if(tab === 'rates') {
    html += `<div class="dd-row" style="margin-bottom:12px"><span style="font-size:12px;color:var(--ink-mid)">Current rate</span><span style="font-size:14px;font-weight:700;color:var(--ink)">${d.rate_override!=null?'$'+parseFloat(d.rate_override).toFixed(2)+'/night':'Default ($'+parseFloat(settings.boardingRate||55).toFixed(2)+'/night)'}</span></div>`;
    if(rateNotes.length) {
      html += `<div class="dd-sec">Change history</div>`;
      html += rateNotes.map(n=>noteRow(n)).join('');
    } else {
      html += `<div style="font-size:12px;color:var(--ink-faint)">No rate changes logged yet.</div>`;
    }
  }

  else if(tab === 'vaccinations') {
    const vb = dogVaccBadge(d);
    const vs = vaccStatus;
    const rv=vs(d.vacc_rabies), dv=vs(d.vacc_dhpp), bv=vs(d.vacc_bordetella);
    html += `<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
      <div class="dd-row"><div><div style="font-size:12px;font-weight:600">Rabies</div><div style="font-size:10px;color:var(--ink-faint)">${d.vacc_rabies?'Expires '+new Date(d.vacc_rabies).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Not recorded'}</div></div><span class="vbdg ${rv.cls}">${rv.label}</span></div>
      <div class="dd-row"><div><div style="font-size:12px;font-weight:600">DHPP</div><div style="font-size:10px;color:var(--ink-faint)">${d.vacc_dhpp?'Expires '+new Date(d.vacc_dhpp).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Not recorded'}</div></div><span class="vbdg ${dv.cls}">${dv.label}</span></div>
      <div class="dd-row"><div><div style="font-size:12px;font-weight:600">Bordetella</div><div style="font-size:10px;color:var(--ink-faint)">${d.vacc_bordetella?'Expires '+new Date(d.vacc_bordetella).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Not recorded'}</div></div><span class="vbdg ${bv.cls}">${bv.label}</span></div>
    </div>`;
    if(d.vacc_file_url) html += `<a href="${d.vacc_file_url}" target="_blank" class="btn btn-o sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">📎 View vaccination records file</a>`;
    else html += `<div style="font-size:12px;color:var(--ink-faint)">No vaccination records file attached.</div>`;
  }

  targetEl.innerHTML = html;
}

// ── Drawer ─────────────────────────────
function openDogDrawer(id) {
  const d = dogs.find(x=>x.id===id); if(!d) return;
  activeDogId = id;
  dogHistId = id; // keep legacy compatible for addVisitNote etc.
  // header
  const avEl = document.getElementById('dd-av');
  avEl.innerHTML = d.photo ? `<img src="${d.photo}" alt="">` : '🐶';
  document.getElementById('dd-name').textContent = d.dog_name;
  const vb = dogVaccBadge(d);
  document.getElementById('dd-meta').textContent = (d.breed||'Unknown breed') + ' · ' + esc(d.owner_name) + (d.rate_override!=null?' · $'+parseFloat(d.rate_override).toFixed(2)+'/night':'');
  // tabs
  const DRAWER_TABS = [['overview','Overview'],['notes','Notes'],['reservations','Stays'],['invoices','Invoices'],['rates','Rates'],['vaccinations','Vaccinations']];
  document.getElementById('dd-tabs').innerHTML = DRAWER_TABS.map(([key,label])=>`<div class="dd-tab${ddActiveTab===key?' on':''}" onclick="switchDrawerTab('${key}')">${label}</div>`).join('');
  // body
  renderDogTabContent(d, ddActiveTab, document.getElementById('dd-body'));
  // show
  document.getElementById('dog-drawer').classList.add('on');
  document.getElementById('dog-drawer-backdrop').classList.add('on');
}

function switchDrawerTab(tab) {
  ddActiveTab = tab;
  const d = dogs.find(x=>x.id===activeDogId); if(!d) return;
  document.querySelectorAll('.dd-tab').forEach(t=>t.classList.toggle('on', t.textContent.toLowerCase()===tab||t.onclick.toString().includes("'"+tab+"'")));
  // re-render tabs to set active correctly
  const DRAWER_TABS = [['overview','Overview'],['notes','Notes'],['reservations','Stays'],['invoices','Invoices'],['rates','Rates'],['vaccinations','Vaccinations']];
  document.getElementById('dd-tabs').innerHTML = DRAWER_TABS.map(([key,label])=>`<div class="dd-tab${ddActiveTab===key?' on':''}" onclick="switchDrawerTab('${key}')">${label}</div>`).join('');
  renderDogTabContent(d, tab, document.getElementById('dd-body'));
}

function closeDogDrawer() {
  document.getElementById('dog-drawer').classList.remove('on');
  document.getElementById('dog-drawer-backdrop').classList.remove('on');
}

function openDogProfileFromDrawer() {
  const id = activeDogId;
  closeDogDrawer();
  setTimeout(()=>openDogProfile(id), 150);
}

// ── Full profile modal ─────────────────
function openDogFull(id) {
  const targetId = id || activeDogId; if(!targetId) return;
  const d = dogs.find(x=>x.id===targetId); if(!d) return;
  activeDogId = targetId;
  dogHistId = targetId;
  dfActiveTab = 'overview';
  closeDogDrawer();
  // header
  const avEl = document.getElementById('df-av');
  avEl.innerHTML = d.photo ? `<img src="${d.photo}" alt="">` : '🐶';
  document.getElementById('df-name').textContent = d.dog_name;
  document.getElementById('df-meta').textContent = (d.owner_name||'') + (d.phone?' · '+d.phone:'') + (d.owner_email?' · '+d.owner_email:'');
  const vb = dogVaccBadge(d);
  const rate = d.rate_override!=null?'$'+parseFloat(d.rate_override).toFixed(2)+'/night':'Default rate';
  document.getElementById('df-badges').innerHTML =
    `<span class="df-badge vbdg ${vb.cls}">💉 ${vb.label}</span>` +
    `<span class="df-badge" style="background:var(--forest-pale);color:var(--forest)">💰 ${rate}</span>` +
    (d.breed?`<span class="df-badge" style="background:var(--cream-dark);color:var(--ink-mid)">${esc(d.breed)}</span>`:'');
  // sidebar
  renderDogFullSidebar(d);
  // tabs
  renderDogFullTabs(d);
  // content
  renderDogTabContent(d, dfActiveTab, document.getElementById('df-content'));
  // show
  document.getElementById('dog-full-mo').classList.add('on');
}

function renderDogFullSidebar(d) {
  const t = d.traits||{};
  const sb = document.getElementById('df-sb');
  const rv=vaccStatus(d.vacc_rabies), dv=vaccStatus(d.vacc_dhpp), bv=vaccStatus(d.vacc_bordetella);
  const fields = [
    ['Breed', d.breed],
    ['Temperament', t.temperament],
    ['With other dogs', t.social],
    ['Energy', t.energy ? t.energy+' energy' : null],
    ['Playfulness', t.play ? t.play+' play' : null],
    ['Eating', t.eating],
  ].filter(([,v])=>v);
  sb.innerHTML = `
    <div>
      <div class="df-sb-sec">Behaviour</div>
      ${fields.map(([l,v])=>`<div class="df-field"><span class="df-fl">${l}</span><span class="df-fv">${esc(v)}</span></div>`).join('')}
      ${t.handling?`<div style="font-size:11px;color:var(--ink-light);margin-top:7px;line-height:1.4;padding:7px;background:var(--cream-mid);border-radius:var(--r2)">📌 ${esc(t.handling)}</div>`:''}
    </div>
    <div>
      <div class="df-sb-sec">Vaccinations</div>
      <div class="df-field"><span class="df-fl">Rabies</span><span class="df-fv"><span class="vbdg ${rv.cls}" style="font-size:10px">${rv.label}</span></span></div>
      <div class="df-field"><span class="df-fl">DHPP</span><span class="df-fv"><span class="vbdg ${dv.cls}" style="font-size:10px">${dv.label}</span></span></div>
      <div class="df-field"><span class="df-fl">Bordetella</span><span class="df-fv"><span class="vbdg ${bv.cls}" style="font-size:10px">${bv.label}</span></span></div>
      ${d.vacc_file_url?`<a href="${d.vacc_file_url}" target="_blank" style="font-size:11px;color:var(--brown);text-decoration:none;display:flex;align-items:center;gap:4px;margin-top:6px">📎 View records</a>`:''}
    </div>
    ${d.notes?`<div><div class="df-sb-sec">Care notes</div><div style="font-size:12px;color:var(--ink-light);line-height:1.5">${esc(d.notes)}</div></div>`:''}`;
}

function renderDogFullTabs(d) {
  const FULL_TABS = [['overview','Overview'],['notes','Notes'],['reservations','Reservations'],['invoices','Invoices'],['rates','Rate history'],['vaccinations','Vaccinations']];
  document.getElementById('df-tabs').innerHTML = FULL_TABS.map(([key,label])=>`<div class="df-tab${dfActiveTab===key?' on':''}" onclick="switchFullTab('${key}')">${label}</div>`).join('');
}

function switchFullTab(tab) {
  dfActiveTab = tab;
  const d = dogs.find(x=>x.id===activeDogId); if(!d) return;
  renderDogFullTabs(d);
  renderDogTabContent(d, tab, document.getElementById('df-content'));
}

function openDogProfileFromFull() {
  const id = activeDogId;
  closeDogFull();
  setTimeout(()=>openDogProfile(id), 150);
}

function closeDogFull() {
  document.getElementById('dog-full-mo').classList.remove('on');
}

// close full modal on backdrop click — deferred until DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const fullMo = document.getElementById('dog-full-mo');
  if(fullMo) fullMo.addEventListener('click', function(e) {
    if(e.target===this) closeDogFull();
  });
});

// override old openDogHistory to use new drawer — also deferred
document.addEventListener('DOMContentLoaded', function() {
  window.openDogHistory = openDogDrawer;
});

// re-render drawer/full when notes change so they stay fresh
const _origRenderDogHistBody = typeof renderDogHistBody === 'function' ? renderDogHistBody : null;
function refreshDogPanels() {
  const d = dogs.find(x=>x.id===activeDogId); if(!d) return;
  if(document.getElementById('dog-drawer').classList.contains('on')) {
    renderDogTabContent(d, ddActiveTab, document.getElementById('dd-body'));
  }
  if(document.getElementById('dog-full-mo').classList.contains('on')) {
    renderDogTabContent(d, dfActiveTab, document.getElementById('df-content'));
  }
}

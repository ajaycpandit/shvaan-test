/* ═══════════════════════════════════════
   EXCEL IMPORT / EXPORT
═══════════════════════════════════════ */
function getXLSX() {
  return new Promise((res,rej)=>{
    if(window.XLSX){res(window.XLSX);return;}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload=()=>res(window.XLSX); s.onerror=()=>rej(new Error('Could not load Excel library.'));
    document.head.appendChild(s);
  });
}

async function exportDogs() {
  if(!dogs.length){toast('No dogs to export.',true);return;}
  try {
    const XLSX=await getXLSX();
    const rows=[['Dog Name','Owner Name','Phone','Owner Email','Custom Rate ($/day)','Notes','Breed','Rabies Expiry','DHPP Expiry','Bordetella Expiry']];
    dogs.forEach(d=>rows.push([d.dog_name||'',d.owner_name||'',d.phone||'',d.owner_email||'',d.rate_override!=null?parseFloat(d.rate_override):'',d.notes||'',d.breed||'',d.vacc_rabies||'',d.vacc_dhpp||'',d.vacc_bordetella||'']));
    const ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=[{wch:20},{wch:24},{wch:18},{wch:20},{wch:36}];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Dogs');
    XLSX.writeFile(wb,'paws-board-dogs-'+new Date().toISOString().slice(0,10)+'.xlsx');
    toast('Exported '+dogs.length+' dog'+(dogs.length!==1?'s':'')+'.');
  } catch(e){toast('Export failed: '+e.message,true);}
}

async function importDogs(input) {
  const file=input.files[0]; if(!file) return;
  const re=document.getElementById('imp-result'); re.style.display='none';
  try {
    const XLSX=await getXLSX();
    const buf=await file.arrayBuffer(), wb=XLSX.read(buf,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]], rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    if(rows.length<2) throw new Error('Spreadsheet appears empty.');
    const hdrs=rows[0].map(h=>String(h).toLowerCase().trim());
    const col=names=>{for(const n of names){const i=hdrs.indexOf(n);if(i!==-1)return i;}return -1;};
    const dc=col(['dog name','dog','dogname']), oc=col(['owner name','owner','ownername','client']);
    if(dc===-1||oc===-1) throw new Error('Cannot find "Dog Name" and "Owner Name" columns.');
    const pc=col(['phone','phone number','tel','mobile']), ec=col(['owner email','email','e-mail']), rc=col(['custom rate ($/day)','custom rate','rate','rate/day']), nc=col(['notes','note','comments']), bc=col(['breed']), rbc=col(['rabies expiry','rabies']), dhc=col(['dhpp expiry','dhpp']), bdc=col(['bordetella expiry','bordetella']);
    const existKeys=new Set(dogs.map(d=>d.dog_name.toLowerCase()+'|'+d.owner_name.toLowerCase()));
    let added=0, skipped=0, toInsert=[];
    rows.slice(1).forEach(r=>{
      const dn=String(r[dc]||'').trim(); if(!dn) return;
      const on=oc!==-1?String(r[oc]||'').trim():'';
      const k=dn.toLowerCase()+'|'+on.toLowerCase();
      if(existKeys.has(k)){skipped++;return;}
      const rv=rc!==-1?r[rc]:'';
      const cv=v=>{ const s=String(v||'').trim(); return s||null; };
      toInsert.push({id:Date.now().toString()+Math.random().toString(36).slice(2),dog_name:dn,owner_name:on,phone:pc!==-1?cv(r[pc]):null,owner_email:ec!==-1?cv(r[ec]):null,rate_override:rv!==''&&rv!=null&&!isNaN(parseFloat(rv))?parseFloat(rv):null,notes:nc!==-1?cv(r[nc]):null,breed:bc!==-1?cv(r[bc]):null,vacc_rabies:rbc!==-1?cv(r[rbc]):null,vacc_dhpp:dhc!==-1?cv(r[dhc]):null,vacc_bordetella:bdc!==-1?cv(r[bdc]):null,photo:null,vacc_file_url:null});
      existKeys.add(k); added++;
    });
    if(toInsert.length) {
      setSyncState('busy');
      // Insert one by one to avoid batch issues
      for(const dog of toInsert) { await dbInsertDog(dog); dogs.push(dog); }
      setSyncState('ok');
    }
    renderDogList(); renderDD(); renderReqDD(); updateBadges();
    re.style.display='block'; re.style.color='var(--forest)';
    re.innerHTML='✅ Added <strong>'+added+'</strong> dog'+(added!==1?'s':'')+(skipped?', skipped <strong>'+skipped+'</strong> duplicate'+(skipped!==1?'s':''):'')+ '.';
    toast('Imported '+added+' dog'+(added!==1?'s':'')+'.');
  } catch(e){re.style.display='block';re.style.color='var(--danger)';re.textContent='⚠️ '+e.message;}
  input.value='';
}

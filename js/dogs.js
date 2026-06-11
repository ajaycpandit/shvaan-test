/* ═══════════════════════════════════════
   DOG DROPDOWN
═══════════════════════════════════════ */
function renderDD() {
  const hint = document.getElementById('no-dogs-hint');
  const btn  = document.getElementById('dd-btn');
  const tags = document.getElementById('sel-tags');
  if (!dogs.length) { btn.style.display='none'; tags.innerHTML=''; hint.style.display='block'; return; }
  btn.style.display='flex'; hint.style.display='none';
  const cnt = selDogs.size;
  const lbl = document.getElementById('dd-lbl');
  lbl.textContent = cnt ? cnt+' dog'+(cnt>1?'s':'')+' selected' : 'Choose dogs…';
  lbl.style.color  = cnt ? 'var(--ink)' : 'var(--ink-faint)';
  renderDDList();
  tags.innerHTML = [...selDogs].map(id => {
    const d = dogs.find(x=>x.id===id); if(!d) return '';
    return `<span class="sel-tag"><span class="sel-tag-ava">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</span>${esc(d.dog_name)}<span class="sel-tag-x" onclick="toggleDog('${d.id}')">×</span></span>`;
  }).join('');
}
function renderDDList() {
  const list = document.getElementById('dd-list'); if(!list) return;
  const q = (document.getElementById('dd-search')?.value||'').toLowerCase().trim();
  const filtered = dogs.filter(d => !q || (d.dog_name||'').toLowerCase().includes(q) || (d.owner_name||'').toLowerCase().includes(q));
  if(!filtered.length){ list.innerHTML='<div style="padding:14px;text-align:center;font-size:13px;color:var(--ink-faint)">No dogs match "'+esc(q)+'"</div>'; return; }
  list.innerHTML = filtered.map(d => `
    <div class="dd-item${selDogs.has(d.id)?' sel':''}" onclick="toggleDog('${d.id}')">
      <div class="dd-ava">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div>
      <div style="flex:1;min-width:0">
        <div class="dd-name">${esc(d.dog_name)}</div>
        <div class="dd-sub">${esc(d.owner_name)}${d.rate_override!=null?' · $'+parseFloat(d.rate_override).toFixed(2)+'/day':''}</div>
      </div>
      <div class="dd-chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
    </div>`).join('');
}
function toggleDD() {
  ddOpen = !ddOpen;
  document.getElementById('dd-menu').style.display = ddOpen ? 'block' : 'none';
  document.getElementById('dd-btn').classList.toggle('open', ddOpen);
  if(ddOpen){ const s=document.getElementById('dd-search'); if(s){ s.value=''; renderDDList(); setTimeout(()=>s.focus(),50); } }
}
function closeDD() {
  ddOpen = false;
  const m=document.getElementById('dd-menu'); if(m) m.style.display='none';
  const b=document.getElementById('dd-btn'); if(b) b.classList.remove('open');
}
document.addEventListener('click', e => { if(!e.target.closest('.dd-wrap')) closeDD(); });
function toggleDog(id) {
  if(selDogs.has(id)) selDogs.delete(id); else selDogs.add(id);
  renderDD(); recalc();
}

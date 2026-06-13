/* ═══════════════════════════════════════
   GLOBAL SEARCH (Cmd+K / click search bar)
   Searches across dogs, requests, and bookings.
   Results rendered in a dropdown from the nav.
═══════════════════════════════════════ */

let searchOpen = false;

function openSearch() {
  searchOpen = true;
  const w = document.getElementById('search-wrap');
  if (w) { w.classList.add('on'); setTimeout(()=>document.getElementById('search-input').focus(), 80); }
}
function closeSearch() {
  searchOpen = false;
  const w = document.getElementById('search-wrap');
  if (w) { w.classList.remove('on'); document.getElementById('search-input').value = ''; document.getElementById('search-results').innerHTML = ''; }
}

function runSearch(q) {
  const el = document.getElementById('search-results');
  if (!q || q.length < 2) { el.innerHTML = '<div class="sr-empty">Type at least 2 characters…</div>'; return; }
  const ql = q.toLowerCase();
  let html = '';
  let count = 0;

  // Search dogs
  const dMatches = dogs.filter(d =>
    (d.dog_name||'').toLowerCase().includes(ql) ||
    (d.owner_name||'').toLowerCase().includes(ql) ||
    (d.breed||'').toLowerCase().includes(ql) ||
    (d.phone||'').toLowerCase().includes(ql) ||
    (d.owner_email||'').toLowerCase().includes(ql)
  ).slice(0, 5);
  if (dMatches.length) {
    html += '<div class="sr-group">Dogs</div>';
    html += dMatches.map(d => {
      const vb = typeof dogVaccBadge==='function' ? dogVaccBadge(d) : {cls:'',label:''};
      return `<div class="sr-item" onclick="closeSearch();goPage('dogs');setTimeout(()=>openDogDrawer('${d.id}'),150)">
        <div class="sr-ava">${d.photo?`<img src="${d.photo}" alt="">`:'🐶'}</div>
        <div class="sr-info">
          <div class="sr-name">${highlight(esc(d.dog_name),ql)}</div>
          <div class="sr-meta">${highlight(esc(d.owner_name),ql)}${d.breed?' · '+esc(d.breed):''}</div>
        </div>
        ${vb.label?`<span class="vbdg ${vb.cls}" style="font-size:9px;flex-shrink:0">${vb.label}</span>`:''}
      </div>`;
    }).join('');
    count += dMatches.length;
  }

  // Search requests (active)
  const rMatches = requests.filter(r =>
    (r.dog_name||'').toLowerCase().includes(ql) ||
    (r.owner_name||'').toLowerCase().includes(ql) ||
    (r.status||'').toLowerCase().includes(ql) ||
    (r.notes||'').toLowerCase().includes(ql)
  ).slice(0, 5);
  if (rMatches.length) {
    html += '<div class="sr-group">Reservations</div>';
    html += rMatches.map(r => {
      const fd = s => { try{return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});}catch(e){return '';} };
      const stLabel = {pending:'Pending',confirmed:'Confirmed',checked_in:'Checked In',completed:'Completed'}[r.status]||r.status;
      return `<div class="sr-item" onclick="closeSearch();goPage('requests')">
        <div class="sr-ava" style="background:var(--forest-pale);font-size:14px">${r.service==='boarding'?'🏡':'☀️'}</div>
        <div class="sr-info">
          <div class="sr-name">${highlight(esc(r.dog_name||''),ql)}</div>
          <div class="sr-meta">${fd(r.checkin)} → ${fd(r.checkout)} · ${stLabel}</div>
        </div>
      </div>`;
    }).join('');
    count += rMatches.length;
  }

  // Search bookings (history)
  const bMatches = bookings.filter(b =>
    (b.entries||[]).some(e=>(e.dogName||'').toLowerCase().includes(ql)) ||
    (b.id||'').toLowerCase().includes(ql)
  ).slice(0, 5);
  if (bMatches.length) {
    html += '<div class="sr-group">Past bookings</div>';
    html += bMatches.map(b => {
      const fd = s => { try{return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});}catch(e){return '';} };
      const names = (b.entries||[]).map(e=>e.dogName).filter(Boolean).join(', ');
      return `<div class="sr-item" onclick="closeSearch();goPage('history')">
        <div class="sr-ava" style="background:var(--cream-mid);font-size:14px">📋</div>
        <div class="sr-info">
          <div class="sr-name">${highlight(esc(names),ql)}</div>
          <div class="sr-meta">${fd(b.checkin)} → ${fd(b.checkout)} · $${parseFloat(b.grand_total||0).toFixed(2)}</div>
        </div>
      </div>`;
    }).join('');
    count += bMatches.length;
  }

  if (!count) html = '<div class="sr-empty">No results for "' + esc(q) + '"</div>';
  el.innerHTML = html;
}

function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
  return text.replace(re, '<mark style="background:var(--forest-pale);color:var(--forest);padding:0 2px;border-radius:2px">$1</mark>');
}

// Keyboard shortcut: Cmd/Ctrl + K opens search
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape' && searchOpen) closeSearch();
});

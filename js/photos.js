/* ═══════════════════════════════════════
   STAY PHOTOS  (standalone — no email dependency)
   ───────────────────────────────────────
   Photos for a stay live in Supabase Storage, keyed by reservation id:
       stay-photos/{reservationId}/{timestamp}-{rand}.jpg

   This module is self-contained:
     • Storage helpers (upload / list / delete) modelled on uploadVaccFile()
     • Client-side compression (canvas, no deps)
     • A gallery modal (staff: add/delete, customer: view-only)
     • A cleanup seam (deleteStayPhotos) the future email Edge Function reuses

   The cleanup is NOT auto-wired at checkout — current policy is keep photos,
   manual delete only. The seam below is ready for the V-next email flow:
       zip(listStayPhotos) -> email -> deleteStayPhotos()
═══════════════════════════════════════ */

const STAY_BUCKET = 'stay-photos';
// Tunables for client-side compression
const PHOTO_MAX_EDGE = 1600;   // px, longest side
const PHOTO_QUALITY  = 0.82;   // JPEG quality

/* ── Storage helpers (mirror core.js uploadVaccFile patterns) ── */

// Compress a File/Blob to a JPEG Blob via canvas. Falls back to original on failure.
function compressImage(file) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const cv = document.createElement('canvas');
          cv.width = width; cv.height = height;
          cv.getContext('2d').drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          cv.toBlob(
            (blob) => resolve(blob || file),
            'image/jpeg',
            PHOTO_QUALITY
          );
        } catch (e) { URL.revokeObjectURL(url); resolve(file); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    } catch (e) { resolve(file); }
  });
}

// Upload one photo for a reservation. Returns { path, url }.
async function uploadStayPhoto(reservationId, file) {
  const blob = await compressImage(file);
  const name = Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
  const path = encodeURIComponent(reservationId) + '/' + name;
  const r = await fetch(SB_URL + '/storage/v1/object/' + STAY_BUCKET + '/' + path, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (authToken || SB_KEY),
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true'
    },
    body: blob
  });
  if (!r.ok) throw new Error('Photo upload failed: ' + (await r.text().catch(()=>r.statusText)));
  return {
    path: reservationId + '/' + name,
    url: SB_URL + '/storage/v1/object/public/' + STAY_BUCKET + '/' + path
  };
}

// List all photos for a reservation. Returns [{ name, path, url }] sorted oldest→newest.
async function listStayPhotos(reservationId) {
  const r = await fetch(SB_URL + '/storage/v1/object/list/' + STAY_BUCKET, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (authToken || SB_KEY),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prefix: reservationId + '/',
      limit: 200,
      sortBy: { column: 'name', order: 'asc' }
    })
  });
  if (!r.ok) return [];
  const rows = await r.json().catch(() => []);
  return (rows || [])
    .filter(o => o && o.name && o.name !== '.emptyFolderPlaceholder')
    .map(o => {
      const path = reservationId + '/' + o.name;
      return {
        name: o.name,
        path,
        url: SB_URL + '/storage/v1/object/public/' + STAY_BUCKET + '/' +
             encodeURIComponent(reservationId) + '/' + encodeURIComponent(o.name)
      };
    });
}

// Delete a single photo by its storage path ("{reservationId}/{name}").
async function deleteStayPhoto(path) {
  const enc = path.split('/').map(encodeURIComponent).join('/');
  const r = await fetch(SB_URL + '/storage/v1/object/' + STAY_BUCKET + '/' + enc, {
    method: 'DELETE',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (authToken || SB_KEY) }
  });
  if (!r.ok) throw new Error('Delete failed');
  return true;
}

// Delete ALL photos for a reservation. This is the cleanup seam.
// The future email Edge Function should: zip(listStayPhotos) → email → call this.
async function deleteStayPhotos(reservationId) {
  const items = await listStayPhotos(reservationId);
  if (!items.length) return 0;
  const r = await fetch(SB_URL + '/storage/v1/object/' + STAY_BUCKET, {
    method: 'DELETE',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (authToken || SB_KEY),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prefixes: items.map(i => i.path) })
  });
  if (!r.ok) throw new Error('Bulk delete failed');
  return items.length;
}

/* ── Gallery modal ── */

let photoResId = null;       // reservation id whose gallery is open
let photoReadOnly = false;   // customer view = true

// Open the gallery for a reservation. readOnly hides add/delete (customer portal).
async function openStayPhotos(reservationId, opts = {}) {
  photoResId = reservationId;
  photoReadOnly = !!opts.readOnly;
  const r = (typeof requests !== 'undefined') ? requests.find(x => x.id === reservationId) : null;
  const title = opts.title || (r ? (r.dog_name + ' — Stay Photos') : 'Stay Photos');
  document.getElementById('photo-title').textContent = title;
  document.getElementById('photo-add-row').style.display = photoReadOnly ? 'none' : 'flex';
  document.getElementById('photo-mo').classList.add('on');
  await renderStayPhotos();
}

function closeStayPhotos() {
  document.getElementById('photo-mo').classList.remove('on');
  photoResId = null; photoReadOnly = false;
  const inp = document.getElementById('photo-file');
  if (inp) inp.value = '';
}

async function renderStayPhotos() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '<div class="es"><span class="ei">⏳</span><p>Loading photos…</p></div>';
  let items = [];
  try { items = await listStayPhotos(photoResId); }
  catch (e) { grid.innerHTML = '<div class="es"><span class="ei">⚠️</span><p>Could not load photos.</p></div>'; return; }

  if (!items.length) {
    grid.innerHTML = '<div class="es"><span class="ei">📷</span><p>' +
      (photoReadOnly ? 'No photos yet — check back soon!' : 'No photos yet. Add the first one above.') +
      '</p></div>';
    return;
  }

  grid.innerHTML = items.map(it => `
    <div class="photo-cell">
      <a href="${it.url}" target="_blank" rel="noopener">
        <img src="${it.url}" alt="Stay photo" loading="lazy">
      </a>
      ${photoReadOnly ? '' :
        `<button class="photo-del" title="Delete photo"
           onclick="removeStayPhoto('${esc(it.path)}')">×</button>`}
    </div>`).join('');
}

// Triggered by the hidden file input (multiple allowed).
async function onStayPhotoPick(inputEl) {
  const files = Array.from(inputEl.files || []);
  if (!files.length || !photoResId) return;
  const btn = document.getElementById('photo-add-btn');
  const orig = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }
  setSyncState('busy');
  let ok = 0, fail = 0;
  for (const f of files) {
    if (!/^image\//.test(f.type)) { fail++; continue; }
    try { await uploadStayPhoto(photoResId, f); ok++; }
    catch (e) { console.error('Upload error:', e); fail++; }
  }
  setSyncState(fail && !ok ? 'err' : 'ok');
  if (btn) { btn.disabled = false; btn.textContent = orig; }
  inputEl.value = '';
  await renderStayPhotos();
  if (ok)   toast(ok + (ok > 1 ? ' photos added!' : ' photo added!'));
  if (fail) toast(fail + ' photo' + (fail > 1 ? 's' : '') + ' failed.', true);
}

async function removeStayPhoto(path) {
  if (!confirm('Delete this photo? This cannot be undone.')) return;
  setSyncState('busy');
  try {
    await deleteStayPhoto(path);
    setSyncState('ok');
    await renderStayPhotos();
    toast('Photo deleted.');
  } catch (e) { setSyncState('err'); toast('Delete failed: ' + e.message, true); }
}

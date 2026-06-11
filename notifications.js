/* ═══════════════════════════════════════
   SUPABASE CONFIG — TEST ENVIRONMENT
   Same project as production, but all
   reads/writes go to the "test" schema.
   Real data in "public" is never touched.

   TO REVERT TO PRODUCTION:
   Remove the Accept-Profile / Content-Profile
   headers from sbFetch below, or swap back
   the original core.js.
═══════════════════════════════════════ */
const SB_URL = 'https://xtvyyszobucmaktpulxt.supabase.co';  // same as production
const SB_KEY = 'sb_publishable_yz_iycmCCjIld2KoB_SNDg_TLHYHdhv';  // same as production

let authToken = null; // Supabase user access token when signed in
async function sbFetch(path, method='GET', body=null, _retried=false) {
  const opts = {
    method,
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + (authToken || SB_KEY),
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : '',
      'Accept-Profile': 'test',   // ← routes reads to the test schema
      'Content-Profile': 'test'   // ← routes writes to the test schema
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SB_URL + '/rest/v1/' + path, opts);
  if (!res.ok) {
    const err = await res.text();
    // Auth/token expiry: try a one-time silent refresh + retry before surfacing the error
    const looksAuth = res.status===401 || /JWT|token is expired|PGRST301|PGRST303/i.test(err);
    if (looksAuth && !_retried && authToken && typeof handleAuthExpiry==='function') {
      const ok = await handleAuthExpiry();
      if (ok) return sbFetch(path, method, body, true);
    }
    throw new Error(err || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* DOGS */
async function dbGetDogs()    { return await sbFetch('dogs?order=created_at.asc') || []; }
async function dbInsertDog(d) { return await sbFetch('dogs', 'POST', d); }
async function dbUpdateDog(id,d){ return await sbFetch('dogs?id=eq.'+encodeURIComponent(id), 'PATCH', d); }
async function dbDeleteDog(id){ return await sbFetch('dogs?id=eq.'+encodeURIComponent(id), 'DELETE'); }
async function dbGetNotes(){ return await sbFetch('visit_notes?order=created_at.desc').catch(()=>[]) || []; }
async function dbAddNote(n){ return await sbFetch('visit_notes','POST',n).catch(e=>{throw e;}); }
async function dbUpdNote(id,d){ return await sbFetch('visit_notes?id=eq.'+encodeURIComponent(id),'PATCH',d).catch(()=>null); }
async function dbDelNote(id){ return await sbFetch('visit_notes?id=eq.'+encodeURIComponent(id),'DELETE').catch(()=>null); }
async function dbUpsertDogs(arr){ return await sbFetch('dogs', 'POST', arr); } // used by import

/* BOOKINGS */
async function dbGetBookings()      { return await sbFetch('bookings?order=saved_at.desc') || []; }
async function dbInsertBooking(b)   { return await sbFetch('bookings', 'POST', b); }
async function dbUpdateBooking(id,d){ return await sbFetch('bookings?id=eq.'+encodeURIComponent(id), 'PATCH', d); }
async function dbDeleteBooking(id)  { return await sbFetch('bookings?id=eq.'+encodeURIComponent(id), 'DELETE'); }
async function dbDeleteAllBookings(){ return await sbFetch('bookings?id=neq.____none____', 'DELETE'); }

/* SETTINGS */
async function dbGetSettings() {
  const rows = await sbFetch('settings?id=eq.global') || [];
  return rows[0]?.data || null;
}
async function dbSaveSettings(data) {
  return await sbFetch('settings?id=eq.global', 'DELETE').catch(()=>{}).then(()=>
    sbFetch('settings', 'POST', { id:'global', data })
  );
}

/* REQUESTS */
async function dbGetReqs(){ return await sbFetch('requests?order=created_at.desc').catch(()=>[]) || []; }
async function dbAddReq(r){ return await sbFetch('requests','POST',r).catch(()=>null); }
async function dbUpdReq(id,d){ return await sbFetch('requests?id=eq.'+encodeURIComponent(id),'PATCH',d).catch(()=>null); }
async function dbDelReq(id){ return await sbFetch('requests?id=eq.'+encodeURIComponent(id),'DELETE').catch(()=>null); }

/* VACC FILE UPLOAD (Supabase Storage) */
async function uploadVaccFile(dogId, file){
  const ext = file.name.split('.').pop();
  const path = 'vacc/'+dogId+'.'+ext;
  const r = await fetch(SB_URL+'/storage/v1/object/vacc-records/'+path, {
    method:'POST',
    headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':file.type,'x-upsert':'true'},
    body:file
  });
  if(!r.ok) throw new Error('File upload failed');
  return SB_URL+'/storage/v1/object/public/vacc-records/'+path;
}

/* ═══════════════════════════════════════
   APP STATE
═══════════════════════════════════════ */
const DEF = { boardingRate:55, daycareRate:35, threshold:3, surchargePct:50, bizName:'Shvaan Pet Care', bizPhone:'', bizEmail:'', bizAddr:'', capacity:12 };
const DEFAULT_LOGO = 'data:image/png;base64,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';
function currentLogo(){ return (settings && settings.logo) ? settings.logo : (localStorage.getItem('shvaan_logo') || DEFAULT_LOGO); }
function applyLogo(){ const l=currentLogo(); ['logo-loading','logo-sidebar','logo-mobile','logo-login','logo-customer'].forEach(id=>{ const el=document.getElementById(id); if(el) el.src=l; }); document.querySelectorAll('.logo-invoice').forEach(el=>el.src=l); }
// Apply cached/default logo to the loading screen immediately (before Supabase loads)
(function(){ try{ const cached=localStorage.getItem('shvaan_logo')||DEFAULT_LOGO; const setEarly=()=>{ const el=document.getElementById('logo-loading'); if(el) el.src=cached; }; if(document.getElementById('logo-loading')) setEarly(); else document.addEventListener('DOMContentLoaded', setEarly); }catch(e){} })();
let dogs=[], bookings=[], requests=[], visitNotes=[], settings={...DEF};
let staffName=localStorage.getItem('shvaan_staff')||'';
let selDogs=new Set(), svc='boarding', pendingPhoto=null, pendingVaccFile=null, ddOpen=false, invBid=null;
let calYear, calMonth, notifOpen=false, reqDdOpen=false, reqSelDogs=new Set(), reqShowArchived=false;

/* ═══════════════════════════════════════
   ROLES & PERMISSIONS
═══════════════════════════════════════ */
// All gateable sections. Admin always sees all. Staff visibility set per-toggle. Customer uses a separate view.
const SECTIONS = ['dashboard','calc','calendar','requests','dogs','history','finance','settings'];
let myProfile = null; // {user_id, role, permissions:{section:true/false}, owner_name}
function myRole(){ return myProfile ? myProfile.role : 'admin'; } // default admin if no profile (first-run safety)
function isAdmin(){ return myRole()==='admin'; }
function isStaff(){ return myRole()==='staff'; }
function isCustomer(){ return myRole()==='customer'; }
// Can the current user see a given section?
function canSee(section){
  if(isAdmin()) return true;
  if(isCustomer()) return false; // customers use the dedicated customer view, not these sections
  // staff: allowed unless explicitly turned off; settings/finance default OFF for staff unless granted
  const p = (myProfile && myProfile.permissions) || {};
  if(section in p) return !!p[section];
  // sensible defaults for staff when not specified
  if(section==='finance'||section==='settings') return false;
  return true;
}
/* Profile DB helpers — profiles keyed by lowercased email */
async function dbGetMyProfile(email){ if(!email) return null; const r=await sbFetch('profiles?email=eq.'+encodeURIComponent(email.toLowerCase())).catch(()=>null); return r&&r[0]?r[0]:null; }
async function dbGetProfiles(){ return await sbFetch('profiles?order=email.asc').catch(()=>[]) || []; }
async function dbUpsertProfile(p){ await sbFetch('profiles?email=eq.'+encodeURIComponent(p.email.toLowerCase()),'DELETE').catch(()=>{}); return sbFetch('profiles','POST',p); }
async function dbDeleteProfile(email){ return sbFetch('profiles?email=eq.'+encodeURIComponent(email.toLowerCase()),'DELETE'); }


/* ═══════════════════════════════════════
   SYNC STATE UI
═══════════════════════════════════════ */
function setSyncState(state) {
  const dots = [document.getElementById('sync-dot'), document.getElementById('sync-dot2')];
  const lbls = [document.getElementById('sync-lbl'), document.getElementById('sync-lbl2')];
  const map = { ok:{cls:'',txt:'Connected'}, busy:{cls:'busy',txt:'Saving…'}, err:{cls:'err',txt:'Error'} };
  const s = map[state] || map.ok;
  dots.forEach(d => { if(d){ d.className='sync-dot'; if(s.cls) d.classList.add(s.cls); }});
  lbls.forEach(l => { if(l) l.textContent = s.txt; });
}

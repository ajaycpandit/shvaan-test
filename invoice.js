/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
async function init() {
  setLoadStatus('Signing in…');
  try {
    // Load the current user's profile (role + permissions). Falls back to admin if none exists (first-run).
    if(currentUser && currentUser.email){
      try{ myProfile = await dbGetMyProfile(currentUser.email); }catch(e){ myProfile=null; }
    }
    // If a customer, route to the dedicated customer experience instead of the staff app.
    if(myProfile && myProfile.role==='customer'){
      await initCustomer();
      return;
    }
    setLoadStatus('Loading data…');
    [dogs, bookings] = await Promise.all([dbGetDogs(), dbGetBookings()]);
    requests = await dbGetReqs();
    visitNotes = await dbGetNotes();
    const s = await dbGetSettings();
    if (s) settings = {...DEF, ...s};
    try{ if(settings.logo) localStorage.setItem('shvaan_logo', settings.logo); else localStorage.removeItem('shvaan_logo'); }catch(e){}
    setLoadStatus('Ready!');
    await new Promise(r => setTimeout(r, 400));
    document.getElementById('loading').style.opacity='0';
    setTimeout(()=>{ document.getElementById('loading').style.display='none'; },400);
    document.getElementById('app-shell').style.display='';
    applyLogo();
    applyRoleNav();
    const le=document.getElementById('logout-email'); if(le&&currentUser&&currentUser.email) le.textContent=currentUser.email;
    renderDD();
    renderSettings();
    renderReqDD();
    updateBadges();
    renderDashboard();
    setSyncState('ok');
  } catch(e) {
    setLoadStatus('⚠️ Could not connect: ' + e.message);
    setSyncState('err');
    setTimeout(()=>{
      document.getElementById('loading').style.display='none';
      document.getElementById('app-shell').style.display='';
    }, 2000);
  }
  const today = new Date().toISOString().split('T')[0];
  ['ci-d','co-d','req-ci','req-co'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=today; });
  const n=new Date(); calYear=n.getFullYear(); calMonth=n.getMonth();
}

/* Show/hide nav items + landing based on role & permissions */
function applyRoleNav(){
  SECTIONS.forEach(sec=>{
    const show=canSee(sec);
    ['ni-'+sec,'bni-'+sec].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=show?'':'none'; });
  });
  // If the current/landing page isn't visible to this user, jump to the first one they can see.
  const firstVisible = SECTIONS.find(s=>canSee(s)) || 'dashboard';
  goPage(firstVisible);
}

function setLoadStatus(msg) { document.getElementById('load-status').textContent = msg; }

/* ═══════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════ */
function goPage(id) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bni').forEach(n => n.classList.remove('active'));
  document.getElementById('pg-'+id).classList.add('active');
  const ni=document.getElementById('ni-'+id), bni=document.getElementById('bni-'+id);
  if(ni) ni.classList.add('active');
  if(bni) bni.classList.add('active');
  document.querySelector('.main').scrollTo(0,0);
  closeDD(); closeReqDD();
  if(id==='dogs') renderDogList();
  if(id==='history') renderHistory();
  if(id==='settings') renderSettings();
  if(id==='calc') renderDD();
  if(id==='dashboard') renderDashboard();
  if(id==='calendar'){ renderCalendar(); renderUpcoming(); if(calViewMode==='list') renderCalList(); }
  if(id==='requests'){ renderReqDD(); renderRequests(); }
  if(id==='finance'){ if(!document.getElementById('fin-from').value) finPreset('3m'); else renderFinance(); }
}
function refreshActive(){
  const active=document.querySelector('.pg.active');
  if(!active) return;
  const id=active.id.replace('pg-','');
  if(id==='dashboard') renderDashboard();
  else if(id==='calendar'){ renderCalendar(); renderUpcoming(); if(calViewMode==='list') renderCalList(); }
  else if(id==='history') renderHistory();
  else if(id==='finance' && document.getElementById('fin-from').value) renderFinance();
}

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */
function toast(msg, isErr=false) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.style.background = isErr ? 'var(--danger)' : 'var(--brown-dark)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2800);
}

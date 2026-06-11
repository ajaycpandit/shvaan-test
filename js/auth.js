/* Refresh the access token using the stored refresh token. Returns true on success. */
let _refreshing=null;
async function refreshSession(){
  // De-dupe concurrent refreshes
  if(_refreshing) return _refreshing;
  _refreshing=(async()=>{
    let sess=null;
    try{ sess=JSON.parse(localStorage.getItem('shvaan_session')||'null'); }catch(e){}
    if(!sess||!sess.refresh) return false;
    try{
      const res=await fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{
        method:'POST', headers:{'apikey':SB_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({refresh_token:sess.refresh})
      });
      const data=await res.json();
      if(!res.ok||!data.access_token) return false;
      authToken=data.access_token;
      currentUser=data.user||currentUser||{email:sess.email};
      localStorage.setItem('shvaan_session', JSON.stringify({token:data.access_token, refresh:data.refresh_token||sess.refresh, email:(data.user&&data.user.email)||sess.email, exp:Date.now()+(data.expires_in||3600)*1000}));
      scheduleProactiveRefresh(data.expires_in||3600);
      return true;
    }catch(e){ return false; }
  })();
  const r=await _refreshing; _refreshing=null; return r;
}
/* Schedule a refresh shortly before expiry so the token rarely lapses mid-use. */
let _refreshTimer=null;
function scheduleProactiveRefresh(expiresInSec){
  if(_refreshTimer) clearTimeout(_refreshTimer);
  const ms=Math.max(30000,(expiresInSec-120)*1000); // refresh 2 min before expiry, min 30s
  _refreshTimer=setTimeout(()=>{ refreshSession(); }, ms);
}
/* Called by sbFetch when a request fails auth — refresh once, signal retry. */
async function handleAuthExpiry(){
  const ok=await refreshSession();
  if(!ok){ sessionLost(); }
  return ok;
}
/* Session truly gone — drop to login without nuking the page state. */
function sessionLost(){
  authToken=null;
  try{ localStorage.removeItem('shvaan_session'); }catch(e){}
  toast('Your session expired — please sign in again.', true);
  showLogin();
}
/* ── Start ── */
/* ═══════════════════════════════════════
   AUTHENTICATION (Supabase Auth)
═══════════════════════════════════════ */
let currentUser=null;
function showLogin(){
  document.getElementById('loading').style.display='none';
  const as=document.getElementById('app-shell'); if(as) as.style.display='none';
  const ls=document.getElementById('login-screen'); ls.style.display='flex';
  const lg=document.getElementById('logo-login'); if(lg) lg.src=(localStorage.getItem('shvaan_logo')||DEFAULT_LOGO);
  setTimeout(()=>{ const e=document.getElementById('login-email'); if(e) e.focus(); },100);
}
async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  const errEl=document.getElementById('login-err'), btn=document.getElementById('login-btn');
  errEl.textContent='';
  if(!email||!pass){ errEl.textContent='Enter your email and password.'; return; }
  btn.disabled=true; btn.style.opacity='.7'; btn.innerHTML='Signing in…';
  try{
    const res=await fetch(SB_URL+'/auth/v1/token?grant_type=password',{
      method:'POST', headers:{'apikey':SB_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({email,password:pass})
    });
    const data=await res.json();
    if(!res.ok){ throw new Error(data.error_description||data.msg||data.error||'Sign in failed'); }
    authToken=data.access_token;
    currentUser=data.user;
    // persist session
    try{ localStorage.setItem('shvaan_session', JSON.stringify({token:data.access_token, refresh:data.refresh_token, email:(data.user&&data.user.email)||email, exp:Date.now()+(data.expires_in||3600)*1000})); }catch(e){}
    scheduleProactiveRefresh(data.expires_in||3600);
    // staff name defaults to email prefix if not set
    if(!staffName){ staffName=(email.split('@')[0]||'Staff'); localStorage.setItem('shvaan_staff',staffName); }
    document.getElementById('login-screen').style.display='none';
    document.getElementById('login-pass').value='';
    document.getElementById('loading').style.display='flex';
    document.getElementById('loading').style.opacity='1';
    btn.disabled=false; btn.style.opacity='1'; btn.innerHTML='Sign In';
    init();
  }catch(e){
    errEl.textContent=e.message;
    btn.disabled=false; btn.style.opacity='1'; btn.innerHTML='Sign In';
  }
}
async function tryRestoreSession(){
  let sess=null;
  try{ sess=JSON.parse(localStorage.getItem('shvaan_session')||'null'); }catch(e){}
  if(!sess||!sess.token){ showLogin(); return; }
  // If token still valid by our clock, use it and schedule a refresh
  if(sess.exp && Date.now()<sess.exp-60000){
    authToken=sess.token; currentUser={email:sess.email};
    scheduleProactiveRefresh(Math.max(60,Math.floor((sess.exp-Date.now())/1000)));
    init(); return;
  }
  // Token old/expired — try a refresh before giving up
  const ok=await refreshSession();
  if(ok){ init(); }
  else { try{ localStorage.removeItem('shvaan_session'); }catch(e){} showLogin(); }
}
function doLogout(){
  if(!confirm('Sign out?')) return;
  authToken=null; currentUser=null;
  if(_refreshTimer) clearTimeout(_refreshTimer);
  try{ localStorage.removeItem('shvaan_session'); }catch(e){}
  location.reload();
}
tryRestoreSession();


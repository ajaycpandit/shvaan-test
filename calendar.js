/* Shvaan Pet Care — styles (extracted from single-file v1) */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --cream:#FBF6EF;--cream-mid:#F5ECE0;--cream-dark:#EAD9C6;
  --brown-light:#F0A868;--brown:#E07B2E;--brown-dark:#C25E18;
  --forest:#E07B2E;--forest-light:#F0A868;--forest-pale:#FCEEDF;
  --ink:#2A211A;--ink-mid:#4F4339;--ink-light:#7E6F61;--ink-faint:#B3A595;
  --white:#FFFFFF;--danger:#D9534F;--danger-pale:#FBEDEC;
  --gold:#C8841C;--gold-pale:#FDF4E5;
  --coral:#E8674C;--coral-pale:#FCEEEA;
  --r1:6px;--r2:10px;--r3:16px;--r4:20px;
  --s1:0 1px 4px rgba(42,33,26,.07);--s2:0 4px 16px rgba(42,33,26,.10);--s3:0 8px 32px rgba(42,33,26,.16);
  --nav-h:62px;
}
html{font-size:16px;scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);min-height:100vh;line-height:1.6}

/* ── Layout ── */
.app{display:grid;grid-template-columns:220px 1fr;min-height:100vh}
.sb{background:var(--brown-dark);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.sb-brand{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.08)}
.sb-paw{font-size:26px;display:block;margin-bottom:4px}
.sb-name{font-family:'DM Serif Display',serif;font-size:18px;color:var(--cream);line-height:1.1}
.sb-tag{font-size:10px;color:var(--brown-light);margin-top:3px;letter-spacing:.06em;text-transform:uppercase}
.sb-nav{flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:2px}
.ni{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r2);cursor:pointer;font-size:14px;font-weight:400;color:var(--brown-light);transition:background .15s,color .15s;border:none;background:none;text-align:left;width:100%;font-family:'DM Sans',sans-serif;min-height:44px}
.ni:hover{background:rgba(255,255,255,.07);color:var(--cream)}
.ni.active{background:rgba(255,255,255,.13);color:var(--cream);font-weight:600}
.ni svg{width:18px;height:18px;flex-shrink:0;opacity:.8}
.ni.active svg{opacity:1}
.ni{position:relative}
.ni-badge{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:var(--danger);color:white;border-radius:99px;font-size:10px;font-weight:700;padding:1px 6px;min-width:18px;text-align:center}
.bni{position:relative}
.bni-badge{position:absolute;top:6px;right:calc(50% - 18px);background:var(--danger);color:white;border-radius:99px;font-size:9px;font-weight:700;padding:1px 5px;min-width:16px;text-align:center}
:root{--blue:#1A56A0;--bluep:#EBF2FB}
.bdg-b{background:var(--bluep);color:var(--blue);border:1px solid #BCCFE8}
.btn-b{background:var(--blue);color:white;border-color:var(--blue)}.btn-b:active{opacity:.85}
/* breed search */
.breed-wrap{position:relative}
.breed-dd{position:absolute;top:calc(100% + 3px);left:0;right:0;background:var(--white);border:1.5px solid var(--cream-dark);border-radius:var(--radius-md);box-shadow:var(--shadow-md);z-index:100;max-height:200px;overflow-y:auto;display:none}
.breed-opt{padding:9px 12px;font-size:13px;cursor:pointer;color:var(--ink-mid)}
.breed-opt:hover,.breed-opt.focused{background:var(--cream-mid);color:var(--ink)}
/* vacc */
.vacc-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.vbdg{font-size:10px;padding:2px 7px;border-radius:99px;font-weight:600;display:inline-flex;align-items:center;gap:3px}
.vbdg.ok{background:var(--forest-pale);color:var(--forest);border:1px solid #C0D5C1}
.vbdg.warn{background:var(--gold-pale);color:var(--gold);border:1px solid #E8D5A0}
.vbdg.exp{background:var(--danger-pale);color:var(--danger);border:1px solid #EAB0AC}
.vbdg.none{background:var(--cream-mid);color:var(--ink-faint);border:1px solid var(--cream-dark)}
.file-box{border:1.5px dashed var(--cream-dark);border-radius:var(--radius-md);padding:14px;text-align:center;cursor:pointer;transition:all .15s;background:var(--cream-mid)}
.file-box:hover{border-color:var(--brown);background:var(--white)}
.file-box.has-file{border-color:var(--forest);background:var(--forest-pale)}
/* notifications */
.notif-btn{position:relative;cursor:pointer;background:none;border:none;padding:0;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;transition:background .15s}
.notif-btn:hover{background:rgba(255,255,255,.1)}
.notif-btn svg{width:20px;height:20px;color:var(--brown-light)}
.notif-btn .nbadge{position:absolute;top:0;right:0;background:var(--danger);color:white;border-radius:99px;font-size:9px;font-weight:700;padding:1px 4px;min-width:15px;text-align:center;line-height:1.4}
.notif-panel{position:absolute;top:calc(100% + 8px);right:0;width:310px;background:var(--white);border:1px solid var(--cream-dark);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);z-index:500;overflow:hidden}
.notif-header{padding:11px 15px;border-bottom:1px solid var(--cream-dark);display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;color:var(--ink)}
.notif-list{max-height:320px;overflow-y:auto}
.notif-item{padding:10px 14px;border-bottom:1px solid var(--cream-mid);display:flex;gap:9px;align-items:flex-start}
.notif-item:last-child{border-bottom:none}
.notif-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.notif-icon.checkin{background:var(--forest-pale)}.notif-icon.checkout{background:var(--gold-pale)}.notif-icon.vacc{background:var(--danger-pale)}.notif-icon.req{background:var(--bluep)}
.notif-title{font-size:12px;font-weight:600;color:var(--ink)}
.notif-sub{font-size:11px;color:var(--ink-faint);margin-top:1px}
.notif-empty{padding:22px;text-align:center;font-size:13px;color:var(--ink-faint)}
.notif-wrap{position:relative}
/* calendar */
.cal-wrap{background:var(--white);border:1px solid var(--cream-dark);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-sm);margin-bottom:14px}
.cal-header{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid var(--cream-dark)}
.cal-title{font-family:'DM Serif Display',serif;font-size:18px;color:var(--ink)}
.cal-nav{display:flex;gap:4px}
.cal-nav button{width:32px;height:32px;border-radius:50%;border:1px solid var(--cream-dark);background:var(--cream-mid);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
.cal-nav button:hover{background:var(--cream-dark)}
.cal-nav svg{width:15px;height:15px;color:var(--ink-mid)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr)}
.cal-dow{padding:9px 0;text-align:center;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-faint);border-bottom:1px solid var(--cream-dark)}
.cal-day{min-height:80px;padding:6px;border-right:1px solid var(--cream-mid);border-bottom:1px solid var(--cream-mid);cursor:pointer;transition:background .12s;position:relative}
.cal-day:nth-child(7n){border-right:none}
.cal-day:hover{background:var(--cream-mid)}
.cal-day.other-month .cal-day-num{color:var(--ink-faint);opacity:.35}
.cal-day.today .cal-day-num{background:var(--brown-dark);color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:700}
.cal-day-num{font-size:12px;font-weight:600;color:var(--ink-mid);margin-bottom:3px;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
.cal-event{font-size:9px;font-weight:600;padding:2px 5px;border-radius:3px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-event.in{background:#EEF6F0;color:var(--forest)}
.cal-event.out{background:var(--gold-pale);color:var(--gold)}
.cal-event.stay{background:var(--bluep);color:var(--blue)}
.cal-event.req{background:#F0EDFB;color:#6B4FA0}
.cal-event.more{background:var(--cream-mid);color:var(--ink-faint);font-style:italic}
.cal-legend{display:flex;gap:13px;padding:11px 18px;flex-wrap:wrap;border-top:1px solid var(--cream-mid)}
.cal-legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-light)}
.cal-legend-dot{width:10px;height:10px;border-radius:2px;flex-shrink:0}
@media(max-width:700px){.cal-day{min-height:52px;padding:4px}.cal-event{display:none}.cal-day.has-events::after{content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:var(--brown)}}
/* request cards */
.req-card{background:var(--white);border:1px solid var(--cream-dark);border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:10px;box-shadow:var(--shadow-sm)}
.req-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.req-title{font-size:14px;font-weight:600;color:var(--ink)}
.req-sub{font-size:12px;color:var(--ink-light);margin-top:1px}
.req-status{font-size:10px;font-weight:600;padding:3px 8px;border-radius:99px}
.req-status.pending{background:var(--bluep);color:var(--blue);border:1px solid #BCCFE8}
.req-status.confirmed{background:var(--forest-pale);color:var(--forest);border:1px solid #C5DEC7}
.req-status.declined{background:var(--danger-pale);color:var(--danger);border:1px solid #EAB0AC}
.req-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.req-meta span{font-size:11px;color:var(--ink-faint);display:flex;align-items:center;gap:3px}
.req-meta svg{width:11px;height:11px}
/* day modal */
.mo{position:fixed;inset:0;background:rgba(28,20,16,.6);z-index:1000;display:none;align-items:flex-end;justify-content:center}
.mo.on{display:flex}
@media(min-width:701px){.mo{align-items:center;padding:18px}}
.mo-inner{background:var(--white);width:100%;max-height:92dvh;overflow-y:auto;border-radius:var(--radius-xl) var(--radius-xl) 0 0;box-shadow:var(--shadow-lg)}
@media(min-width:701px){.mo-inner{max-width:560px;border-radius:var(--radius-xl)}}
.mo-head{padding:14px 20px;border-bottom:1px solid var(--cream-dark);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--white);z-index:1}
.mo-head h3{font-family:'DM Serif Display',serif;font-size:17px}
.mo-body{padding:18px 20px 26px}
.sb-foot{padding:14px 20px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:rgba(196,168,130,.5);text-align:center;display:flex;align-items:center;justify-content:center;gap:6px}
.sync-dot{width:7px;height:7px;border-radius:50%;background:#6A8F6B;flex-shrink:0;display:inline-block}
.sync-dot.busy{background:#B8860B;animation:pulse 1s infinite}
.sync-dot.err{background:#C0392B}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.mtb{display:none}
.bn{display:none}
.main{overflow-y:auto;overflow-x:hidden}
.pg{display:none;padding:36px 44px;max-width:860px;animation:fi .18s ease}
.pg.active{display:block}
@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

/* ── Mobile ── */
@media(max-width:700px){
  .app{grid-template-columns:1fr;min-height:100dvh}
  .sb{display:none}
  .mtb{display:flex;align-items:center;justify-content:space-between;background:var(--brown-dark);padding:13px 16px;padding-top:calc(13px + env(safe-area-inset-top));position:sticky;top:0;z-index:100}
  .mtb-name{font-family:'DM Serif Display',serif;font-size:17px;color:var(--cream)}
  .mtb-sync{font-size:11px;color:var(--brown-light);display:flex;align-items:center;gap:5px}
  .pg{padding:18px 14px;padding-bottom:calc(18px + var(--nav-h) + env(safe-area-inset-bottom))}
  .bn{display:flex;position:fixed;bottom:0;left:0;right:0;background:var(--brown-dark);border-top:1px solid rgba(255,255,255,.1);padding-bottom:env(safe-area-inset-bottom);z-index:200;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .bn::-webkit-scrollbar{display:none}
  .bni{flex:1 0 auto;min-width:18%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 4px;gap:3px;cursor:pointer;border:none;background:none;color:var(--brown-light);font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;transition:color .15s;min-height:var(--nav-h);-webkit-tap-highlight-color:transparent}
  .bni svg{width:21px;height:21px}
  .bni.active{color:var(--cream)}
  .g2{grid-template-columns:1fr!important}
  #dash-kpis{grid-template-columns:1fr 1fr!important;gap:8px!important}
  #dash-kpis .card{padding:12px 10px!important}
  #dash-kpis .card div:nth-child(2){font-size:21px!important}
  #dash-ops{grid-template-columns:1fr!important}
  #dash-lower{grid-template-columns:1fr!important}
  #fin-cards{grid-template-columns:1fr 1fr 1fr!important;gap:6px!important}
  #fin-cards .card{padding:10px 6px!important}
  #fin-cards .card div:last-child{font-size:18px!important}
  .ph h1{font-size:21px}
  .card{padding:15px 15px!important;border-radius:var(--r3)!important}
  .dia{width:100%;justify-content:flex-end}
  .di{flex-wrap:wrap}
  .bw table.bt{display:none}
  .mbk{display:block}
  .toast{bottom:calc(var(--nav-h) + 10px + env(safe-area-inset-bottom))!important;right:10px!important;left:10px!important;max-width:none!important}
  .hac .btn.sm{flex:1;min-width:0;font-size:11px;padding:0 7px}
  .iig{grid-template-columns:1fr!important}
  .inv-modal-inner{border-radius:var(--r4) var(--r4) 0 0!important;max-width:100%!important}
  .dog-add-row{flex-direction:column!important}
  .pu-wrap{width:100%!important}
  .pu{width:100%!important;flex-direction:row!important;gap:14px!important;padding:12px 14px!important;text-align:left!important}
  .pu img{margin:0!important;width:52px!important;height:52px!important}
  .pu .upl{margin-bottom:0!important;font-size:26px}
}

/* ── Page header ── */
.ph{margin-bottom:24px}
.ph h1{font-family:'DM Serif Display',serif;font-size:28px;color:var(--ink);line-height:1.15}
.ph p{font-size:13px;color:var(--ink-light);margin-top:3px}

/* ── Cards ── */
.card{background:var(--white);border:1px solid var(--cream-dark);border-radius:var(--r4);padding:22px 24px;margin-bottom:16px;box-shadow:var(--s1)}
.ct{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:15px;display:flex;align-items:center;gap:7px}
.ct svg{width:14px;height:14px;color:var(--brown)}

/* ── Forms ── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fd{display:flex;flex-direction:column;gap:5px}
.fd label{font-size:11px;font-weight:600;color:var(--ink-mid);letter-spacing:.02em}
.fd input,.fd select,.fd textarea{height:44px;padding:0 13px;border:1.5px solid var(--cream-dark);border-radius:var(--r2);background:var(--cream-mid);color:var(--ink);font-size:16px;font-family:'DM Sans',sans-serif;transition:border-color .15s,box-shadow .15s;width:100%;outline:none;-webkit-appearance:none;appearance:none}
.fd input:focus,.fd select:focus,.fd textarea:focus{border-color:var(--brown);box-shadow:0 0 0 3px rgba(139,107,71,.12);background:var(--white)}
.fd select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B6B47' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;padding-right:34px;cursor:pointer}
.fd textarea{height:auto;padding:10px 13px;font-size:15px;resize:vertical}
.fh{font-size:11px;color:var(--ink-faint);margin-top:1px}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 17px;height:44px;border-radius:var(--r2);font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;border:1.5px solid transparent;white-space:nowrap;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.btn svg{width:15px;height:15px;flex-shrink:0}
.btn-p{background:var(--brown-dark);color:var(--cream);border-color:var(--brown-dark)}
.btn-p:active{opacity:.85}
.btn-o{background:transparent;color:var(--ink-mid);border-color:var(--cream-dark)}
.btn-o:active{background:var(--cream-mid)}
.btn-g{background:var(--forest);color:white;border-color:var(--forest)}
.btn-g:active{opacity:.85}
.btn-d{background:transparent;color:var(--danger);border-color:#EAB0AC}
.btn-d:active{background:var(--danger-pale)}
.sm{height:34px;padding:0 12px;font-size:12px}
.btn-row{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}

/* ── Service toggle ── */
.svc-tog{display:flex;background:var(--cream-mid);border:1.5px solid var(--cream-dark);border-radius:var(--r3);padding:4px;margin-bottom:17px;gap:3px;width:100%}
.svc-btn{flex:1;padding:9px 14px;border-radius:var(--r2);border:none;background:transparent;color:var(--ink-light);font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;-webkit-tap-highlight-color:transparent}
.svc-btn.active{background:var(--white);color:var(--brown-dark);box-shadow:var(--s1);font-weight:600}

/* ── Dog dropdown ── */
.dd-wrap{position:relative;margin-bottom:6px}
.dd-btn{width:100%;height:44px;padding:0 13px;border:1.5px solid var(--cream-dark);border-radius:var(--r2);background:var(--cream-mid);color:var(--ink);font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;transition:border-color .15s;text-align:left}
.dd-btn:hover,.dd-btn.open{border-color:var(--brown);background:var(--white)}
.dd-btn svg{flex-shrink:0;transition:transform .2s}
.dd-btn.open svg{transform:rotate(180deg)}
.dd-menu{position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--white);border:1.5px solid var(--cream-dark);border-radius:var(--r3);box-shadow:var(--s2);z-index:50;max-height:260px;overflow-y:auto}
.dd-item{display:flex;align-items:center;gap:10px;padding:10px 13px;cursor:pointer;transition:background .12s;border-bottom:1px solid var(--cream-mid)}
.dd-item:last-child{border-bottom:none}
.dd-item:hover{background:var(--cream-mid)}
.dd-item.sel{background:#FBF6F0}
.dd-ava{width:30px;height:30px;border-radius:50%;background:var(--cream-mid);border:1.5px solid var(--cream-dark);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px}
.dd-ava img{width:100%;height:100%;object-fit:cover}
.dd-name{font-size:13px;font-weight:600;color:var(--ink)}
.dd-sub{font-size:11px;color:var(--ink-faint)}
.dd-chk{margin-left:auto;width:18px;height:18px;border-radius:50%;background:var(--brown);display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0;transition:opacity .12s}
.dd-item.sel .dd-chk{opacity:1}
.dd-chk svg{width:10px;height:10px;color:white}
.sel-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.sel-tag{display:inline-flex;align-items:center;gap:5px;background:#FBF6F0;border:1px solid #E0C9B0;border-radius:99px;padding:4px 10px 4px 6px;font-size:12px;font-weight:600;color:var(--brown-dark)}
.sel-tag-ava{width:20px;height:20px;border-radius:50%;overflow:hidden;background:var(--cream-mid);display:flex;align-items:center;justify-content:center;font-size:10px}
.sel-tag-ava img{width:100%;height:100%;object-fit:cover}
.sel-tag-x{cursor:pointer;color:var(--brown);margin-left:2px;font-size:15px;line-height:1}

/* ── Results table ── */
.bw{overflow-x:auto;-webkit-overflow-scrolling:touch}
table.bt{width:100%;border-collapse:collapse;font-size:13px;min-width:440px}
table.bt th{text-align:left;padding:7px 9px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);border-bottom:1.5px solid var(--cream-dark)}
table.bt th:last-child{text-align:right}
table.bt td{padding:11px 9px;border-bottom:1px solid var(--cream-mid);vertical-align:middle;color:var(--ink-mid)}
table.bt td:last-child{text-align:right;font-weight:600;color:var(--ink)}
table.bt tr:last-child td{border-bottom:none}
.drn{font-weight:600;color:var(--ink);font-size:13px}
.dro{font-size:11px;color:var(--ink-faint);margin-top:1px}
.mbk{display:none}
.bdg{display:inline-block;padding:3px 8px;border-radius:99px;font-size:10px;font-weight:600}
.bdg-w{background:var(--gold-pale);color:var(--gold);border:1px solid #E8D5A0}
.bdg-g{background:var(--forest-pale);color:var(--forest);border:1px solid #C0D5C1}
.gtbar{display:flex;align-items:center;justify-content:space-between;margin-top:13px;padding:15px 18px;background:var(--brown-dark);border-radius:var(--r3);color:var(--cream)}
.gtlbl{font-size:12px;opacity:.7}
.gtval{font-family:'DM Serif Display',serif;font-size:28px}
.gtmeta{font-size:11px;color:rgba(250,248,243,.45);margin-top:2px}

/* ── Dog list ── */
.dog-list{display:flex;flex-direction:column;gap:10px}
.di{background:var(--white);border:1px solid var(--cream-dark);border-radius:var(--r3);padding:14px 18px;display:flex;align-items:center;gap:13px;box-shadow:var(--s1);transition:box-shadow .15s}
.di:hover{box-shadow:var(--s2)}
.da{width:50px;height:50px;border-radius:50%;background:var(--cream-mid);border:2px solid var(--cream-dark);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px}
.da img{width:100%;height:100%;object-fit:cover}
.dname{font-size:15px;font-weight:600;color:var(--ink)}
.downer{font-size:12px;color:var(--ink-light);margin-top:1px}
.dmeta{display:flex;gap:10px;margin-top:5px;flex-wrap:wrap}
.dmeta span{font-size:11px;color:var(--ink-faint);display:flex;align-items:center;gap:3px}
.dmeta svg{width:11px;height:11px}
.dia{display:flex;gap:7px;flex-shrink:0}

/* ── Photo upload ── */
.pu{border:2px dashed var(--cream-dark);border-radius:var(--r3);padding:16px 12px;text-align:center;cursor:pointer;transition:all .15s;background:var(--cream-mid);width:108px;display:flex;flex-direction:column;align-items:center}
.pu:active{border-color:var(--brown);background:var(--white)}
.pu img{width:62px;height:62px;border-radius:50%;object-fit:cover;margin:0 auto 5px;display:block;border:2px solid var(--cream-dark)}
.upl{font-size:30px;margin-bottom:4px}
.pu p{font-size:11px;color:var(--ink-faint)}

/* ── History ── */
.hi{background:var(--white);border:1px solid var(--cream-dark);border-radius:var(--r3);padding:17px 20px;box-shadow:var(--s1)}
.hh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px}
.hdogs{display:flex;gap:6px;flex-wrap:wrap;align-items:center;flex:1;margin-right:8px}
.hdp{display:flex;align-items:center;gap:5px;background:var(--cream-mid);border:1px solid var(--cream-dark);border-radius:99px;padding:3px 8px 3px 4px}
.hdpa{width:20px;height:20px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:10px}
.hdpa img{width:100%;height:100%;object-fit:cover}
.hdn{font-size:11px;font-weight:600;color:var(--ink-mid)}
.hamount{font-family:'DM Serif Display',serif;font-size:21px;color:var(--ink);white-space:nowrap}
.hmeta{font-size:11px;color:var(--ink-faint);display:flex;gap:11px;flex-wrap:wrap;margin-bottom:11px}
.hmeta span{display:flex;align-items:center;gap:3px}
.hmeta svg{width:12px;height:12px;flex-shrink:0}
.hac{display:flex;gap:6px;flex-wrap:wrap}
.sp{font-size:10px;font-weight:600;padding:3px 9px;border-radius:99px;display:inline-flex;align-items:center;gap:3px}
.sp-b{background:#EEF6F0;color:var(--forest);border:1px solid #C5DEC7}
.sp-d{background:var(--gold-pale);color:var(--gold);border:1px solid #E8D5A0}

/* ── Settings ── */
.ss{margin-bottom:22px}
.ss h3{font-size:14px;font-weight:600;color:var(--ink-mid);margin-bottom:12px}
.sc-prev{background:var(--forest-pale);border:1px solid #C5DEC7;border-radius:var(--r2);padding:11px 13px;font-size:12px;color:var(--forest);margin-top:12px;line-height:1.6}

/* ── Empty state ── */
.es{text-align:center;padding:36px 14px;color:var(--ink-faint)}
.es .ei{font-size:38px;margin-bottom:10px;display:block}
.es p{font-size:13px}

/* ── Toast ── */
.toast{position:fixed;bottom:22px;right:22px;background:var(--brown-dark);color:var(--cream);padding:11px 16px;border-radius:var(--r3);font-size:12px;font-weight:500;box-shadow:var(--s3);transform:translateY(16px);opacity:0;transition:all .22s;pointer-events:none;z-index:9999;display:flex;align-items:center;gap:7px;max-width:calc(100vw - 32px)}
.toast.show{transform:none;opacity:1}

/* ── Invoice modal ── */
.inv-overlay{position:fixed;inset:0;background:rgba(28,20,16,.6);z-index:1000;display:none;align-items:flex-end;justify-content:center}
.inv-overlay.open{display:flex}
@media(min-width:701px){.inv-overlay{align-items:center;padding:20px}}
.inv-modal-inner{background:var(--white);width:100%;max-height:92dvh;overflow-y:auto;border-radius:var(--r4) var(--r4) 0 0;box-shadow:var(--s3)}
@media(min-width:701px){.inv-modal-inner{max-width:620px;border-radius:var(--r4)}}
.inv-mh{padding:16px 22px;border-bottom:1px solid var(--cream-dark);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--white);z-index:1}
.inv-mh h3{font-family:'DM Serif Display',serif;font-size:18px}
.inv-body{padding:24px 26px 32px}
@media(max-width:700px){.inv-body{padding:18px 16px 32px}}

/* Invoice internals */
.iheader{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;gap:14px}
.ibiz-name{font-family:'DM Serif Display',serif;font-size:22px;color:var(--ink)}
.inum{text-align:right}
.ilbl{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);font-weight:600;margin-bottom:2px}
.ival{font-size:15px;font-weight:600;color:var(--ink)}
.iig{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px}
.iiv{font-size:13px;color:var(--ink);line-height:1.5}
.idg{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.idc{display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:var(--r2);border:1px solid var(--cream-dark);background:var(--cream-mid)}
.ida{width:32px;height:32px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:15px;border:1.5px solid var(--cream-dark);background:var(--cream-mid)}
.ida img{width:100%;height:100%;object-fit:cover}
.idname{font-size:12px;font-weight:600;color:var(--ink)}
.idowner{font-size:10px;color:var(--ink-faint)}
.itable{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px}
.itable th{text-align:left;padding:6px 0;border-bottom:1.5px solid var(--ink);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-mid);font-weight:600}
.itable th:last-child{text-align:right}
.itable td{padding:8px 0;border-bottom:1px solid var(--cream-dark);color:var(--ink-mid);vertical-align:top}
.itable td:last-child{text-align:right;font-weight:600;color:var(--ink)}
.itotal{background:var(--brown-dark);border-radius:var(--r3);padding:13px 17px;display:flex;justify-content:space-between;align-items:center;margin-top:5px}
.itlbl{color:var(--cream);opacity:.7;font-size:12px}
.itval{font-family:'DM Serif Display',serif;font-size:24px;color:var(--cream)}
.ifooter{text-align:center;margin-top:20px;font-size:11px;color:var(--ink-faint)}

/* ── Print ── */
.printable{display:none}
@media print{
  body *{visibility:hidden}
  .printable,.printable *{visibility:visible}
  .printable{position:fixed;inset:0;background:white;padding:32px 40px;font-family:'DM Sans',sans-serif}
  .itotal{background:#5C4230!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}

/* ── Loading overlay ── */
#loading{position:fixed;inset:0;background:var(--brown-dark);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity .4s}
#loading .lp{font-size:40px;margin-bottom:14px;animation:bounce .8s infinite alternate}
#loading .lt{font-family:'DM Serif Display',serif;font-size:20px;color:var(--cream)}
#loading .ls{font-size:12px;color:var(--brown-light);margin-top:6px}
@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-8px)}}

/* ════════════════════════════════════════════════════
   PROFESSIONAL POLISH PASS (additive — safe enhancements)
════════════════════════════════════════════════════ */
/* Constrain ultra-wide screens so content stays readable, centered */
@media(min-width:1400px){ .main{ } .pg{ margin-left:auto; margin-right:auto; } }
/* Smoother, more premium card depth + hover lift on desktop */
@media(min-width:701px){
  .card{ transition: box-shadow .2s ease, transform .2s ease; }
  .hi:hover, .di:hover{ transform: translateY(-1px); }
}
/* Refined focus ring for accessibility + polish */
.fd input:focus, .fd select:focus, .fd textarea:focus,
input:focus, select:focus, textarea:focus{ outline:none; }
/* Buttons: subtle press feedback + smoother transition */
.btn{ transition: background .15s ease, border-color .15s ease, transform .08s ease, opacity .15s ease; }
.btn:active{ transform: scale(.97); }
/* Nav items: smoother hover */
.ni{ transition: background .15s ease, color .15s ease; }
/* Sidebar brand spacing refinement */
.sb-brand img{ transition: opacity .2s ease; }
/* Tables: zebra hover for readability on desktop */
@media(min-width:701px){ table.bt tbody tr:hover{ background: rgba(224,123,46,.04); } }
/* Crisper modal entrance */
.mo.on .mo-inner, .inv-ov.on .inv-inner{ animation: moPop .22s ease; }
@keyframes moPop{ from{ transform: translateY(8px) scale(.99); opacity:.6 } to{ transform:none; opacity:1 } }
/* Loading screen: gentle fade for logo */
#loading img{ animation: fadeIn .4s ease; }
@keyframes fadeIn{ from{opacity:0} to{opacity:1} }
/* Better empty-state spacing */
.es{ line-height:1.6; }
/* Selection color on-brand */
::selection{ background: rgba(224,123,46,.22); }
/* Smooth scrolling within scroll containers */
.main{ scroll-behavior:smooth; }
/* Print niceties: hide nav/sidebar when printing anything */
@media print{ .sb, .bn, .mtb, .notif-wrap{ display:none !important; } }

/* ── Stay Photos gallery ── */
.photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
.photo-cell{position:relative;aspect-ratio:1;border-radius:var(--r2);overflow:hidden;background:var(--cream-mid);border:1px solid var(--cream-dark)}
.photo-cell img{width:100%;height:100%;object-fit:cover;display:block;cursor:zoom-in}
.photo-del{position:absolute;top:5px;right:5px;width:26px;height:26px;border:none;border-radius:50%;background:rgba(217,83,79,.92);color:#fff;font-size:17px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.25)}
.photo-del:hover{background:var(--danger)}

/* ═══════════════════════════════════════════════════════════
   In-app Help & Guide — deep walkthroughs + reference
   Two-pane: category nav (left) + content (right), with search.
   Screenshot slots render an image only if HELP_IMAGES[key] is set,
   so real screenshots can be dropped in later without any rework.
═══════════════════════════════════════════════════════════ */

/* To add a screenshot later: set HELP_IMAGES['slot-key'] = 'url-or-dataURI'.
   Any {img:'slot-key', cap:'Caption'} block will then render that image. */
const HELP_IMAGES = {};

/* Content model:
   section = { id, icon, title, blurb, blocks:[...] }
   block types:
     {h:'Heading'}                     -> subheading
     {p:'paragraph text'}              -> paragraph
     {steps:['step1','step2',...]}     -> numbered walkthrough
     {ref:[['Term','Definition'],...]} -> reference table
     {tip:'text'} / {warn:'text'}      -> callout
     {img:'slot-key', cap:'Caption'}   -> screenshot slot (renders if image set)
*/
const HELP = [
  {
    id:'getting-started', icon:'🚀', title:'Getting Started',
    blurb:'The big picture and how to move around the app.',
    blocks:[
      {p:'Shvaan Pet Care\u2019s Boarding Manager is your operations hub. From here you manage dog profiles, take and confirm booking requests, check dogs in and out, bill each stay automatically, track who owes you money, share stay photos, and keep an eye on how full you are.'},
      {h:'Moving around'},
      {p:'The left sidebar (or the bottom bar on a phone) switches between the main sections. The top-right header has your notifications bell, a link to your public website, this Help guide, and Sign out.'},
      {img:'nav-overview', cap:'The main navigation and header'},
      {h:'Who sees what'},
      {ref:[
        ['Admin','Full access to everything, including Settings and Finance.'],
        ['Staff','The day-to-day app; can be limited to specific sections by an admin.'],
        ['Customer','A separate, simplified portal showing only their own dogs, stays, and invoices.']
      ]},
      {tip:'If you ever land somewhere unexpected after logging in, it\u2019s almost always your role \u2014 an admin can adjust roles in Settings \u2192 Team & Access.'}
    ]
  },
  {
    id:'dashboard', icon:'🏠', title:'Dashboard',
    blurb:'Your at-a-glance command center for today and the weeks ahead.',
    blocks:[
      {p:'The dashboard is the first thing you see. It answers \u201cwhat\u2019s happening today and what\u2019s coming\u201d without digging into any section.'},
      {h:'Today at a glance'},
      {p:'The top row shows counts for dogs in stay, arriving, and departing today, plus today\u2019s check-ins and check-outs so you know who to expect.'},
      {h:'Currently boarding'},
      {p:'A live list of every dog in your care right now, with check-in details. This is your \u201cwho\u2019s in the building\u201d list.'},
      {h:'Availability this week'},
      {p:'A seven-day strip showing how many spaces are open each day.'},
      {ref:[
        ['Green','Open \u2014 two or more spaces available.'],
        ['Amber','Only one space left that day.'],
        ['Red','Full \u2014 at or over capacity.']
      ]},
      {steps:[
        'Use the \u2039 and \u203a arrows to move to past or future weeks.',
        'Click \u201cThis week\u201d to jump back to the current week.',
        'Click any day to open its detail (who\u2019s arriving, staying, leaving).'
      ]},
      {img:'week-strip', cap:'Availability-this-week strip with color coding'},
      {tip:'Capacity comes from Settings \u2192 Rates & Capacity. Change that number and the colors recalculate automatically.'},
      {h:'Upcoming stays (popup)'},
      {p:'Click \u201c\ud83d\udccb Upcoming stays\u201d on the availability card for the fullest forward picture.'},
      {steps:[
        'Pick a look-ahead window: 1, 2, 3, or 4 weeks.',
        'Currently-boarding dogs are pinned at the top with the date they leave and nights remaining.',
        'Below that, arrivals are listed by date with nights and a status badge.',
        'Click any row to jump to that day\u2019s detail.'
      ]},
      {ref:[
        ['HERE NOW (green)','Dog is currently checked in.'],
        ['CONFIRMED','A confirmed upcoming stay.'],
        ['PENDING (amber)','A request you haven\u2019t confirmed yet \u2014 shown but visually distinct so you don\u2019t mistake it for booked.']
      ]},
      {img:'upcoming-popup', cap:'Upcoming stays popup with currently-boarding pinned on top'},
      {h:'Booking Outlook'},
      {p:'A day-by-day occupancy chart for the next 1 week, 2 weeks, 3 weeks, or a month, with quick stats: arrivals in the period, average occupancy, the peak day, how many days are full, and how many are empty.'},
      {h:'Photos to review'},
      {p:'If any completed stays still have photos in storage, this card lists them so you remember to send them to owners and then clean them up.'}
    ]
  },
  {
    id:'calculator', icon:'🧮', title:'Price Calculator',
    blurb:'Quote a stay instantly and understand exactly how billing works.',
    blocks:[
      {p:'The calculator gives a quick price for a stay before it\u2019s booked \u2014 useful when a client asks \u201chow much would a week cost?\u201d'},
      {h:'Getting a quote'},
      {steps:[
        'Select one or more dogs.',
        'Choose the service (boarding or daycare).',
        'Set check-in and check-out dates and times.',
        'The price updates instantly, itemized per dog.'
      ]},
      {img:'calculator', cap:'The price calculator with a sample quote'},
      {h:'How boarding is billed'},
      {p:'Boarding is charged in 24-hour periods, with a three-tier rule for the leftover time after the last full period:'},
      {ref:[
        ['Within the grace window','No extra charge \u2014 just the full days. (Grace hours are set in Settings.)'],
        ['Between grace and 8 hours over','The surcharge from Settings applies (a percentage or a fixed amount).'],
        ['More than 8 hours over','A full additional day is charged instead of a surcharge.']
      ]},
      {p:'Example: a dog completes 4 full days at 10:30\u202fAM. Picked up at 12:30\u202fPM (2 hours over) \u2192 4 days, no extra. Picked up at 2:00\u202fPM (3.5 hours over) \u2192 4 days plus the surcharge. Picked up at 7:00\u202fPM (8.5 hours over) \u2192 a full 5th day.'},
      {tip:'A dog with a custom rate on its profile is billed at that rate instead of the default.'},
      {h:'How daycare is billed'},
      {p:'Daycare is billed per day \u2014 each started day counts as one.'}
    ]
  },
  {
    id:'reservations', icon:'📋', title:'Reservations',
    blurb:'The heart of the app: from request to confirmed to checked out and billed.',
    blocks:[
      {p:'Every stay moves through a clear lifecycle, and every step can be reversed if you make a mistake.'},
      {h:'The lifecycle'},
      {ref:[
        ['Pending','A new request, not yet accepted.'],
        ['Confirmed','You\u2019ve accepted it; the space is reserved.'],
        ['Checked In','The dog has arrived and is in your care.'],
        ['Completed','The dog has been checked out and billed.'],
        ['Declined','A request you turned down.']
      ]},
      {h:'Create a reservation'},
      {steps:[
        'On the Reservations page, use \u201cNew Request\u201d.',
        'Choose the dog(s) \u2014 you can add several to one reservation.',
        'Pick the service and set dates/times.',
        'Save. It starts as Pending.'
      ]},
      {img:'new-request', cap:'The New Request form'},
      {h:'Confirm or decline'},
      {p:'On a pending request, click Confirm to reserve it or Decline to reject it. Confirming counts it toward your occupancy.'},
      {h:'Check a dog in'},
      {steps:[
        'When the dog arrives, open the confirmed reservation and choose Check In.',
        'Set the actual arrival time (this is what billing uses).',
        'The dog now appears in \u201cCurrently boarding\u201d.'
      ]},
      {h:'Check out & bill'},
      {steps:[
        'At pickup, choose \u201cCheck Out & Bill\u201d.',
        'Set the actual departure time.',
        'The final price is calculated automatically and an invoice is created.',
        'If the stay has photos, you\u2019ll be asked whether to delete them now.'
      ]},
      {img:'checkout', cap:'Check Out & Bill with the price breakdown'},
      {warn:'If a stay already has an invoice, the app won\u2019t create a second one. To re-bill, use Undo Checkout first, then check out again.'},
      {h:'Multi-dog stays'},
      {p:'A reservation can hold several dogs. Each is priced individually and all appear together on one invoice and in history.'},
      {h:'Photos'},
      {p:'Checked-in and completed stays show a Photos button to add or view that stay\u2019s pictures.'},
      {h:'Deleting'},
      {p:'Deleting a reservation also removes its linked invoice (and deleting the invoice removes the reservation), so the two never drift apart. Every deletion is recorded in the Activity Log with who did it.'}
    ]
  },
  {
    id:'dogs', icon:'🐕', title:'Dogs',
    blurb:'Profiles, vaccinations, custom rates, and each dog\u2019s history.',
    blocks:[
      {p:'Every dog has a profile that feeds the rest of the app \u2014 bookings, billing, and vaccination alerts all pull from here.'},
      {h:'Add or edit a dog'},
      {steps:[
        'On the Dogs page, add a new dog or open an existing one to edit.',
        'Fill in name, owner, breed, phone, and a photo if you like.',
        'Add vaccination expiry dates and any notes (allergies, behavior, feeding).',
        'Optionally set a custom nightly rate for this dog.'
      ]},
      {img:'dog-profile', cap:'A dog profile'},
      {h:'Vaccinations'},
      {p:'Track Rabies, DHPP, and Bordetella expiry dates. The app raises alerts when a vaccination is expiring or expired \u2014 and flags it urgently if that dog has an upcoming stay.'},
      {ref:[
        ['Custom rate','Overrides the default nightly rate for just this dog.'],
        ['Notes','Free text for anything staff should know at check-in.'],
        ['Dog history','Opens past stays and any rate-change records for the dog.']
      ]}
    ]
  },
  {
    id:'calendar', icon:'📅', title:'Calendar',
    blurb:'A monthly view of everything on the books.',
    blocks:[
      {p:'The calendar shows arrivals, departures, and ongoing stays across the month.'},
      {steps:[
        'Move between months with the arrows.',
        'Days are tinted by how full they are \u2014 amber when one space is left, red when full.',
        'Click any day to see exactly who\u2019s arriving, staying, and leaving that day.'
      ]},
      {img:'calendar', cap:'Monthly calendar with occupancy coloring'}
    ]
  },
  {
    id:'finance', icon:'💰', title:'Finance',
    blurb:'Chase unpaid invoices and see how you\u2019re doing over any period.',
    blocks:[
      {h:'Outstanding payments'},
      {p:'At the top of the Finance page, every unpaid invoice \u2014 regardless of date \u2014 is listed oldest first, with the total owed and how overdue each one is.'},
      {ref:[
        ['Amber','14+ days since checkout.'],
        ['Red','30+ days \u2014 overdue.'],
        ['Mark Paid','Records the payment (and method) and clears it from the list.']
      ]},
      {img:'outstanding', cap:'Outstanding payments with aging'},
      {tip:'This list ignores the date-range filter on purpose \u2014 an old unpaid invoice should never disappear just because it\u2019s outside the current view.'},
      {h:'Date-range summary'},
      {steps:[
        'Set a From and To date.',
        'See revenue for that window, split into paid and unpaid, with a breakdown.'
      ]}
    ]
  },
  {
    id:'history', icon:'🗂️', title:'History',
    blurb:'A searchable record of every completed stay.',
    blocks:[
      {p:'History holds every completed booking with its dogs, dates, and total.'},
      {h:'Finding a stay'},
      {steps:[
        'Filter by dog, owner, paid status, or service.',
        'Results are paginated \u2014 use Newer/Older to move through pages.'
      ]},
      {h:'Actions on a booking'},
      {ref:[
        ['Invoice','View or print the invoice.'],
        ['Edit dates','Adjust the stay\u2019s dates.'],
        ['Mark paid / unpaid','Update payment status.'],
        ['Delete','Removes the booking and its linked reservation (logged in Activity Log).']
      ]},
      {img:'history', cap:'History list with filters'}
    ]
  },
  {
    id:'settings', icon:'⚙️', title:'Settings',
    blurb:'Rates, capacity, business info, team access, and the activity log.',
    blocks:[
      {h:'Rates & capacity'},
      {ref:[
        ['Boarding / daycare rate','Your default nightly and daily prices.'],
        ['Capacity','How many dogs you can host per day \u2014 drives all the availability colors.'],
        ['Surcharge','A percentage or fixed amount for late-ish pickups, with grace and full-day thresholds.']
      ]},
      {h:'Business info'},
      {p:'Your business name, phone, email, and address \u2014 these appear on invoices.'},
      {h:'Team & Access'},
      {steps:[
        'Add a staff member, admin, or customer by email.',
        'For staff, limit which sections they can see.',
        'Members are grouped by role and searchable, so a large team stays tidy.'
      ]},
      {img:'team', cap:'Team & Access grouped by role'},
      {h:'Activity Log'},
      {p:'A running record of deletions and reversals \u2014 what changed, who did it, and when. Useful for accountability when more than one person uses the app.'},
      {h:'Advanced tools'},
      {p:'Optional tools (like reservation reversal) live behind a toggle so they\u2019re out of the way until you need them.'}
    ]
  },
  {
    id:'customer', icon:'👤', title:'Customer Portal',
    blurb:'What your clients see and do when they log in.',
    blocks:[
      {p:'Customers get a simplified portal \u2014 only their own dogs, stays, and invoices.'},
      {h:'How a client gets an account'},
      {steps:[
        'A new client requests a Meet & Greet on your public website.',
        'After the meet & greet, they create an account from the login screen (\u201cCreate an account\u201d).',
        'They sign in and land in their portal.'
      ]},
      {img:'register', cap:'The customer registration screen'},
      {h:'What customers can do'},
      {ref:[
        ['My Dogs','Add and manage their own dog profiles (you can edit them too).'],
        ['Request stays','Pick dates for boarding or daycare \u2014 these arrive as pending requests for you to confirm.'],
        ['Stays & invoices','View upcoming and past stays and open invoices.'],
        ['Stay photos','View photos you\u2019ve shared from their dog\u2019s stay.']
      ]},
      {tip:'New registrations are open by default. This can be switched to require your approval later without a rebuild.'}
    ]
  },
  {
    id:'photos', icon:'📸', title:'Stay Photos',
    blurb:'Capture, share, and clean up photos from each stay.',
    blocks:[
      {h:'Adding photos'},
      {steps:[
        'Open a checked-in or completed reservation and click Photos.',
        'Upload pictures \u2014 they\u2019re compressed automatically to save space.'
      ]},
      {img:'photos', cap:'The stay-photos gallery'},
      {h:'Sharing & cleanup'},
      {steps:[
        'Customers can view their stay\u2019s photos in their portal.',
        'At checkout you\u2019re asked whether to delete the photos.',
        'If you keep them, the dashboard\u2019s \u201cPhotos to review\u201d card reminds you to clean them up later.'
      ]},
      {warn:'Deleting photos is permanent. Send them to the owner first if you want them to have copies.'}
    ]
  }
];

/* ── State & open/close ─────────────────────────────── */
let helpActive = 'getting-started';
let helpQuery = '';

function openHelp(){
  document.getElementById('help-mo').classList.add('on');
  helpQuery=''; helpActive='getting-started';
  renderHelpShell();
}
function closeHelp(){ document.getElementById('help-mo').classList.remove('on'); }
function helpGo(id){ helpActive=id; helpQuery=''; renderHelpShell(); const b=document.getElementById('help-content'); if(b) b.scrollTop=0; }
function helpSearch(v){ helpQuery=v; renderHelpShell(true); }

/* ── Rendering ──────────────────────────────────────── */
function _helpBlockHTML(b){
  if(b.h) return '<div style="font-size:14px;font-weight:700;color:var(--ink);margin:16px 0 6px">'+esc(b.h)+'</div>';
  if(b.p) return '<p style="font-size:13.5px;color:var(--ink-light);line-height:1.6;margin:0 0 10px">'+esc(b.p)+'</p>';
  if(b.steps) return '<ol style="margin:0 0 12px;padding-left:20px">'+b.steps.map(function(s){return '<li style="font-size:13.5px;color:var(--ink-light);line-height:1.6;margin-bottom:5px">'+esc(s)+'</li>';}).join('')+'</ol>';
  if(b.ref) return '<div style="border:1px solid var(--cream-dark);border-radius:var(--r2);overflow:hidden;margin:0 0 12px">'+b.ref.map(function(r,i){return '<div style="display:flex;gap:12px;padding:9px 12px'+(i<b.ref.length-1?';border-bottom:1px solid var(--cream-mid)':'')+'"><div style="flex:0 0 34%;font-size:13px;font-weight:600;color:var(--ink)">'+esc(r[0])+'</div><div style="flex:1;font-size:13px;color:var(--ink-light);line-height:1.5">'+esc(r[1])+'</div></div>';}).join('')+'</div>';
  if(b.tip) return '<div style="display:flex;gap:8px;background:rgba(74,103,65,0.08);border-radius:var(--r2);padding:10px 12px;margin:0 0 12px"><span>\ud83d\udca1</span><div style="font-size:13px;color:var(--ink-mid);line-height:1.5">'+esc(b.tip)+'</div></div>';
  if(b.warn) return '<div style="display:flex;gap:8px;background:rgba(217,164,65,0.12);border-radius:var(--r2);padding:10px 12px;margin:0 0 12px"><span>\u26a0\ufe0f</span><div style="font-size:13px;color:var(--brown-dark);line-height:1.5">'+esc(b.warn)+'</div></div>';
  if(b.img){
    const src=HELP_IMAGES[b.img];
    if(src){
      return '<figure style="margin:0 0 14px"><img src="'+src+'" alt="'+esc(b.cap||'')+'" style="width:100%;border:1px solid var(--cream-dark);border-radius:var(--r2)">'+(b.cap?'<figcaption style="font-size:11px;color:var(--ink-faint);text-align:center;margin-top:5px">'+esc(b.cap)+'</figcaption>':'')+'</figure>';
    }
    // Placeholder slot (only shows subtly; disappears once an image is added)
    return '<div style="border:1px dashed var(--cream-dark);border-radius:var(--r2);padding:16px;text-align:center;margin:0 0 14px;background:var(--cream)"><div style="font-size:22px;opacity:.4">\ud83d\uddbc\ufe0f</div><div style="font-size:11px;color:var(--ink-faint);margin-top:4px">'+esc(b.cap||'Screenshot')+'</div></div>';
  }
  return '';
}

function _helpSectionHTML(sec){
  return '<div style="font-family:\'DM Serif Display\',serif;font-size:23px;color:var(--ink);margin:0 0 4px;display:flex;align-items:center;gap:9px"><span>'+sec.icon+'</span>'+esc(sec.title)+'</div>'
    + '<div style="font-size:13px;color:var(--ink-faint);margin:0 0 16px">'+esc(sec.blurb)+'</div>'
    + sec.blocks.map(_helpBlockHTML).join('');
}

function renderHelpShell(keepSearchFocus){
  const body=document.getElementById('help-body');
  if(!body) return;
  const q=(helpQuery||'').toLowerCase().trim();

  // Left nav
  const nav = HELP.map(function(sec){
    const on = !q && sec.id===helpActive;
    return '<button onclick="helpGo(\''+sec.id+'\')" style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:9px 11px;border:none;border-radius:var(--r2);cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:13px;margin-bottom:2px;background:'+(on?'var(--cream-mid)':'transparent')+';color:'+(on?'var(--ink)':'var(--ink-mid)')+';font-weight:'+(on?'600':'400')+'"><span style="font-size:15px">'+sec.icon+'</span><span>'+esc(sec.title)+'</span></button>';
  }).join('');

  // Right content
  let content;
  if(q){
    // Search across all sections & blocks
    const results=[];
    HELP.forEach(function(sec){
      sec.blocks.forEach(function(b){
        const text=[b.h,b.p,b.tip,b.warn,b.cap].filter(Boolean).join(' ')
          + (b.steps?' '+b.steps.join(' '):'')
          + (b.ref?' '+b.ref.map(function(r){return r[0]+' '+r[1];}).join(' '):'');
        if(text.toLowerCase().indexOf(q)!==-1){ results.push({sec:sec, block:b}); }
      });
    });
    if(!results.length){
      content='<div style="padding:30px 0;text-align:center;color:var(--ink-faint);font-size:13px">No help topics match \u201c'+esc(helpQuery)+'\u201d.</div>';
    } else {
      // group by section
      const bySec={};
      results.forEach(function(r){ (bySec[r.sec.id]=bySec[r.sec.id]||{sec:r.sec,blocks:[]}).blocks.push(r.block); });
      content='<div style="font-size:12px;color:var(--ink-faint);margin-bottom:14px">'+results.length+' result'+(results.length!==1?'s':'')+' for \u201c'+esc(helpQuery)+'\u201d</div>'
        + Object.keys(bySec).map(function(id){
            const g=bySec[id];
            return '<div style="margin-bottom:18px"><button onclick="helpGo(\''+g.sec.id+'\')" style="background:none;border:none;padding:0;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;color:var(--brown);margin-bottom:6px">'+g.sec.icon+' '+esc(g.sec.title)+' \u2192</button>'
              + g.blocks.map(_helpBlockHTML).join('')+'</div>';
          }).join('');
    }
  } else {
    const sec=HELP.find(function(s){return s.id===helpActive;})||HELP[0];
    content=_helpSectionHTML(sec);
  }

  body.innerHTML =
    '<div style="padding:14px 16px;border-bottom:1px solid var(--cream-dark)">'
      + '<input type="text" id="help-search" value="'+esc(helpQuery)+'" placeholder="\ud83d\udd0d Search all help topics\u2026" oninput="helpSearch(this.value)" style="width:100%;padding:10px 13px;border:1.5px solid var(--cream-dark);border-radius:var(--r2);font-size:14px;background:var(--cream);outline:none">'
    + '</div>'
    + '<div style="display:flex;min-height:420px;max-height:min(70vh,620px)">'
      + '<div style="flex:0 0 190px;border-right:1px solid var(--cream-dark);padding:12px 8px;overflow-y:auto;background:var(--cream)">'+nav+'</div>'
      + '<div id="help-content" style="flex:1;padding:20px 22px;overflow-y:auto">'+content+'</div>'
    + '</div>';

  if(keepSearchFocus){ const s=document.getElementById('help-search'); if(s){ s.focus(); s.setSelectionRange(helpQuery.length,helpQuery.length); } }
}

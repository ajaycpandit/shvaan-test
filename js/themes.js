/* ═══════════════════════════════════════
   THEME SYSTEM — 11 themes
   CSS variable overrides injected into
   <style id="shvaan-theme">. Saved to
   Supabase settings + localStorage.
═══════════════════════════════════════ */

const THEMES = {
  terracotta: {
    label: 'Warm terracotta',
    desc: 'Original warm tones',
    swatches: ['#C25E18','#E07B2E','#F0A868','#FBF6EF','#EAD9C6'],
    nav: '#C25E18',
    css: `:root{--brown-dark:#C25E18;--brown:#E07B2E;--brown-light:#F0A868;--forest:#E07B2E;--forest-light:#F0A868;--forest-pale:#FCEEDF;--cream:#FBF6EF;--cream-mid:#F5ECE0;--cream-dark:#EAD9C6;--coral:#C25E18;--coral-pale:#FCEEDF}`
  },
  teal: {
    label: 'Teal & warm white',
    desc: 'Fresh, caring, trustworthy',
    swatches: ['#085041','#0F6E56','#1D9E75','#F2FAF7','#9FE1CB'],
    nav: '#085041',
    css: `:root{--brown-dark:#085041;--brown:#0F6E56;--brown-light:#5DCAA5;--forest:#1D9E75;--forest-light:#5DCAA5;--forest-pale:#E1F5EE;--cream:#F2FAF7;--cream-mid:#DCF0E8;--cream-dark:#9FE1CB;--coral:#E07B2E;--coral-pale:#FCEEDF}`
  },
  sage: {
    label: 'Sage & stone',
    desc: 'Natural, earthy, outdoors',
    swatches: ['#3B6D11','#639922','#97C459','#F4F7EE','#D8E8C0'],
    nav: '#3B6D11',
    css: `:root{--brown-dark:#3B6D11;--brown:#639922;--brown-light:#97C459;--forest:#639922;--forest-light:#97C459;--forest-pale:#EAF3DE;--cream:#F4F7EE;--cream-mid:#E2EDD1;--cream-dark:#C0DD97;--coral:#E07B2E;--coral-pale:#FCEEDF}`
  },
  navy: {
    label: 'Navy & amber',
    desc: 'Professional, premium',
    swatches: ['#0C447C','#185FA5','#378ADD','#F5F8FC','#B5D4F4'],
    nav: '#0C447C',
    css: `:root{--brown-dark:#0C447C;--brown:#185FA5;--brown-light:#85B7EB;--forest:#185FA5;--forest-light:#85B7EB;--forest-pale:#E6F1FB;--cream:#F5F8FC;--cream-mid:#DCE9F6;--cream-dark:#B5D4F4;--coral:#BA7517;--coral-pale:#FAEEDA}`
  },
  charcoal: {
    label: 'Charcoal & coral',
    desc: 'Modern, bold, high-contrast',
    swatches: ['#2C2C2A','#5F5E5A','#888780','#F8F7F5','#D3D1C7'],
    nav: '#2C2C2A',
    css: `:root{--brown-dark:#2C2C2A;--brown:#5F5E5A;--brown-light:#B4B2A9;--forest:#D85A30;--forest-light:#F0997B;--forest-pale:#FAECE7;--cream:#F8F7F5;--cream-mid:#EDECEA;--cream-dark:#D3D1C7;--coral:#D85A30;--coral-pale:#FAECE7}`
  },
  slate_amber: {
    label: 'Slate & amber',
    desc: 'Corporate warmth',
    swatches: ['#1E293B','#334155','#94A3B8','#F8FAFC','#E2E8F0','#F59E0B'],
    nav: '#1E293B',
    css: `:root{--brown-dark:#1E293B;--brown:#334155;--brown-light:#94A3B8;--forest:#B45309;--forest-light:#F59E0B;--forest-pale:#FEF3E2;--cream:#F8FAFC;--cream-mid:#F1F5F9;--cream-dark:#E2E8F0;--coral:#F59E0B;--coral-pale:#FEF3E2}`
  },
  deep_forest: {
    label: 'Deep forest',
    desc: 'Rich & natural',
    swatches: ['#14532D','#166534','#4ADE80','#F0FDF4','#DCFCE7','#E07B2E'],
    nav: '#14532D',
    css: `:root{--brown-dark:#14532D;--brown:#166534;--brown-light:#4ADE80;--forest:#15803D;--forest-light:#4ADE80;--forest-pale:#DCFCE7;--cream:#F0FDF4;--cream-mid:#DCFCE7;--cream-dark:#BBF7D0;--coral:#E07B2E;--coral-pale:#FFEDD5}`
  },
  warm_plum: {
    label: 'Warm plum',
    desc: 'Premium & distinctive',
    swatches: ['#3B0764','#6D28D9','#A78BFA','#FAF5FF','#EDE9FE','#F59E0B'],
    nav: '#3B0764',
    css: `:root{--brown-dark:#3B0764;--brown:#6D28D9;--brown-light:#A78BFA;--forest:#7C3AED;--forest-light:#A78BFA;--forest-pale:#EDE9FE;--cream:#FAF5FF;--cream-mid:#EDE9FE;--cream-dark:#DDD6FE;--coral:#B45309;--coral-pale:#FEF3E2}`
  },
  rose_stone: {
    label: 'Rose & stone',
    desc: 'Warm & welcoming',
    swatches: ['#881337','#BE185D','#F472B6','#FFF1F2','#FFE4E6','#6B7280'],
    nav: '#881337',
    css: `:root{--brown-dark:#881337;--brown:#BE185D;--brown-light:#F472B6;--forest:#BE185D;--forest-light:#F472B6;--forest-pale:#FFE4E6;--cream:#FFF1F2;--cream-mid:#FFE4E6;--cream-dark:#FECDD3;--coral:#6B7280;--coral-pale:#F1F5F9}`
  },
  midnight_mint: {
    label: 'Midnight & mint',
    desc: 'Modern dark nav',
    swatches: ['#0F172A','#1E293B','#475569','#F8FAFC','#E2E8F0','#10B981'],
    nav: '#0F172A',
    css: `:root{--brown-dark:#0F172A;--brown:#1E293B;--brown-light:#475569;--forest:#059669;--forest-light:#10B981;--forest-pale:#ECFDF5;--cream:#F8FAFC;--cream-mid:#F1F5F9;--cream-dark:#E2E8F0;--coral:#10B981;--coral-pale:#ECFDF5}`
  },
  burnt_sienna: {
    label: 'Burnt sienna',
    desc: 'Refined terracotta',
    swatches: ['#7C2D12','#C2410C','#FB923C','#FFF7ED','#FFEDD5','#0F766E'],
    nav: '#7C2D12',
    css: `:root{--brown-dark:#7C2D12;--brown:#C2410C;--brown-light:#FB923C;--forest:#0F766E;--forest-light:#14B8A6;--forest-pale:#CCFBF1;--cream:#FFF7ED;--cream-mid:#FFEDD5;--cream-dark:#FED7AA;--coral:#C2410C;--coral-pale:#FFEDD5}`
  }
};

let activeTheme = 'terracotta';

/* ── Apply / load ── */
function applyTheme(key) {
  if (!THEMES[key]) return;
  activeTheme = key;
  let el = document.getElementById('shvaan-theme');
  if (!el) { el = document.createElement('style'); el.id = 'shvaan-theme'; document.head.appendChild(el); }
  el.textContent = THEMES[key].css;
  const ld = document.getElementById('loading');
  if (ld) ld.style.background = THEMES[key].nav;
  try { localStorage.setItem('shvaan_theme', key); } catch(e) {}
  updateThemeSettingsRow();
  renderThemePicker();
}

function loadTheme() {
  const saved = (settings && settings.theme) || localStorage.getItem('shvaan_theme') || 'terracotta';
  applyTheme(saved);
}

async function saveTheme(key) {
  applyTheme(key);
  settings.theme = key;
  setSyncState('busy');
  try {
    await dbSaveSettings(settings);
    setSyncState('ok');
    toast('Theme saved!');
  } catch(e) {
    setSyncState('err');
    toast('Could not save theme: ' + e.message, true);
  }
}

/* ── Settings row (compact display) ── */
function updateThemeSettingsRow() {
  const t = THEMES[activeTheme];
  if (!t) return;
  const lbl = document.getElementById('theme-current-label');
  if (lbl) lbl.textContent = t.label;
  const sw = document.getElementById('theme-current-swatches');
  if (sw) sw.innerHTML = t.swatches.slice(0,5).map(c =>
    `<div style="width:16px;height:16px;border-radius:50%;background:${c};border:1.5px solid rgba(0,0,0,.08)"></div>`
  ).join('');
}

/* ── Modal ── */
function openThemeMo() {
  document.getElementById('theme-mo').classList.add('on');
  renderThemePicker();
}
function closeThemeMo() {
  document.getElementById('theme-mo').classList.remove('on');
}
document.addEventListener('DOMContentLoaded', () => {
  const mo = document.getElementById('theme-mo');
  if (mo) mo.addEventListener('click', e => { if (e.target === mo) closeThemeMo(); });
});

/* ── Picker grid (renders inside modal) ── */
function renderThemePicker() {
  const el = document.getElementById('theme-picker');
  if (!el) return;
  el.innerHTML = Object.entries(THEMES).map(([key, t]) => {
    const active = key === activeTheme;
    return `<div onclick="saveTheme('${key}')" style="
      cursor:pointer;border:2px solid ${active ? 'var(--brown)' : 'var(--cream-dark)'};
      border-radius:var(--r3);overflow:hidden;background:var(--white);
      transition:border-color .15s,transform .15s;
      ${active ? '' : 'opacity:.92'}
    " onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
      <div style="height:36px;background:${t.nav};display:flex;align-items:center;padding:0 10px;gap:6px">
        <div style="height:18px;width:50px;background:rgba(255,255,255,.85);border-radius:3px"></div>
        ${[0,1,2].map(()=>`<div style="height:24px;width:38px;border-bottom:2px solid rgba(255,255,255,.25);display:flex;align-items:center;padding:0 6px"><div style="height:5px;background:rgba(255,255,255,.5);border-radius:2px;width:100%"></div></div>`).join('')}
      </div>
      <div style="background:${t.swatches[3]||'#fff'};padding:8px 10px;display:flex;gap:4px;align-items:center">
        ${[t.swatches[4],t.swatches[4],t.swatches[4]].map(c=>`<div style="flex:1;height:14px;border-radius:3px;background:${c}"></div>`).join('')}
      </div>
      <div style="padding:10px 12px;background:var(--white)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:600;color:var(--ink)">${esc(t.label)}</span>
          ${active ? `<span style="font-size:10px;background:var(--brown);color:white;padding:1px 8px;border-radius:99px;font-weight:700">Active</span>` : ''}
        </div>
        <div style="display:flex;gap:3px;margin-bottom:6px">
          ${t.swatches.map(c=>`<div style="flex:1;height:6px;border-radius:2px;background:${c}"></div>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--ink-faint)">${esc(t.desc)}</div>
      </div>
    </div>`;
  }).join('');
}

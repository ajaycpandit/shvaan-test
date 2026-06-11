/* ═══════════════════════════════════════
   THEME SYSTEM
   Themes are CSS variable overrides injected
   into a <style id="shvaan-theme"> tag.
   Chosen theme stored in settings.theme and
   also in localStorage for instant apply on load.
═══════════════════════════════════════ */

const THEMES = {
  terracotta: {
    label: 'Warm terracotta',
    desc: 'Original warm brown tones',
    swatches: ['#C25E18','#E07B2E','#F0A868','#FBF6EF','#EAD9C6'],
    css: `
      :root {
        --primary: #C25E18;
        --primary-mid: #E07B2E;
        --primary-light: #F0A868;
        --primary-pale: #FCEEDF;
        --bg: #FBF6EF;
        --bg-mid: #F5ECE0;
        --bg-dark: #EAD9C6;
        --nav-bg: #C25E18;
        --nav-text: rgba(255,255,255,.65);
        --nav-active: rgba(255,255,255,.15);
        --rp-bg: #FFFFFF;
        --rp-border: #EAD9C6;
        --rp-item: #F5ECE0;
        --accent: #C25E18;
      }
      --brown-dark: var(--primary);
      --brown: var(--primary-mid);
      --brown-light: var(--primary-light);
      --forest: var(--primary-mid);
      --forest-light: var(--primary-light);
      --forest-pale: var(--primary-pale);
      --cream: var(--bg);
      --cream-mid: var(--bg-mid);
      --cream-dark: var(--bg-dark);
    `
  },
  teal: {
    label: 'Teal & warm white',
    desc: 'Fresh, caring, trustworthy',
    swatches: ['#085041','#0F6E56','#1D9E75','#F2FAF7','#9FE1CB'],
    css: `
      :root {
        --brown-dark: #085041;
        --brown: #0F6E56;
        --brown-light: #5DCAA5;
        --forest: #1D9E75;
        --forest-light: #5DCAA5;
        --forest-pale: #E1F5EE;
        --cream: #F2FAF7;
        --cream-mid: #DCF0E8;
        --cream-dark: #9FE1CB;
        --coral: #E07B2E;
        --coral-pale: #FCEEDF;
      }
    `
  },
  sage: {
    label: 'Sage & stone',
    desc: 'Natural, earthy, outdoors',
    swatches: ['#3B6D11','#639922','#97C459','#F4F7EE','#D8E8C0'],
    css: `
      :root {
        --brown-dark: #3B6D11;
        --brown: #639922;
        --brown-light: #97C459;
        --forest: #639922;
        --forest-light: #97C459;
        --forest-pale: #EAF3DE;
        --cream: #F4F7EE;
        --cream-mid: #E2EDD1;
        --cream-dark: #C0DD97;
        --coral: #E07B2E;
        --coral-pale: #FCEEDF;
      }
    `
  },
  navy: {
    label: 'Navy & amber',
    desc: 'Professional, premium',
    swatches: ['#0C447C','#185FA5','#378ADD','#F5F8FC','#B5D4F4'],
    css: `
      :root {
        --brown-dark: #0C447C;
        --brown: #185FA5;
        --brown-light: #85B7EB;
        --forest: #185FA5;
        --forest-light: #85B7EB;
        --forest-pale: #E6F1FB;
        --cream: #F5F8FC;
        --cream-mid: #DCE9F6;
        --cream-dark: #B5D4F4;
        --coral: #BA7517;
        --coral-pale: #FAEEDA;
      }
    `
  },
  charcoal: {
    label: 'Charcoal & coral',
    desc: 'Modern, bold, high-contrast',
    swatches: ['#2C2C2A','#5F5E5A','#888780','#F8F7F5','#D3D1C7'],
    css: `
      :root {
        --brown-dark: #2C2C2A;
        --brown: #5F5E5A;
        --brown-light: #B4B2A9;
        --forest: #D85A30;
        --forest-light: #F0997B;
        --forest-pale: #FAECE7;
        --cream: #F8F7F5;
        --cream-mid: #EDECEA;
        --cream-dark: #D3D1C7;
        --coral: #D85A30;
        --coral-pale: #FAECE7;
      }
    `
  }
};

let activeTheme = 'terracotta';

function applyTheme(key) {
  if (!THEMES[key]) return;
  activeTheme = key;
  let el = document.getElementById('shvaan-theme');
  if (!el) { el = document.createElement('style'); el.id = 'shvaan-theme'; document.head.appendChild(el); }
  el.textContent = THEMES[key].css;
  try { localStorage.setItem('shvaan_theme', key); } catch(e) {}
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

function renderThemePicker() {
  const el = document.getElementById('theme-picker');
  if (!el) return;
  el.innerHTML = Object.entries(THEMES).map(([key, t]) => {
    const active = key === activeTheme;
    return `
      <div onclick="saveTheme('${key}')" style="
        cursor:pointer;border:2px solid ${active ? 'var(--brown)' : 'var(--cream-dark)'};
        border-radius:var(--r3);padding:14px;background:${active ? 'var(--forest-pale)' : 'var(--white)'};
        transition:border-color .15s,background .15s;
      ">
        <div style="display:flex;gap:5px;margin-bottom:10px">
          ${t.swatches.map(c=>`<div style="flex:1;height:20px;border-radius:3px;background:${c}"></div>`).join('')}
        </div>
        <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:2px;display:flex;align-items:center;gap:7px">
          ${esc(t.label)}
          ${active ? `<span style="font-size:10px;background:var(--brown);color:white;padding:1px 7px;border-radius:99px;font-weight:700">Active</span>` : ''}
        </div>
        <div style="font-size:11px;color:var(--ink-faint)">${esc(t.desc)}</div>
      </div>`;
  }).join('');
}

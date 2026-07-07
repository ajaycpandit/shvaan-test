/* ═══════════════════════════════════════════════════════════
   Late-checkout pricing rules manager (Settings)
   Add / edit / reorder / enable / delete rules that decide the
   extra charge for time past the last full 24h period.
   Rules are stored in settings.lateRules and consumed by calcDogSvc.
═══════════════════════════════════════════════════════════ */

// Working copy while editing in Settings (committed on Save Settings).
let lateRulesDraft = null;

function _lateRulesInit(){
  // Load from settings, or seed from the current defaults so the owner sees
  // the active behavior and can tweak it.
  if(settings.lateRules && settings.lateRules.length){
    lateRulesDraft = JSON.parse(JSON.stringify(settings.lateRules));
  } else if(typeof defaultLateRules==='function'){
    lateRulesDraft = JSON.parse(JSON.stringify(defaultLateRules(settings)));
  } else {
    lateRulesDraft = [];
  }
}

function renderLateRules(){
  const host=document.getElementById('late-rules-manager');
  if(!host) return;
  if(lateRulesDraft===null) _lateRulesInit();

  const actionLabel={percent:'% surcharge', fixed:'$ surcharge', fullday:'Full day price'};
  const rows = lateRulesDraft.map(function(r,idx){
    const rangeTxt = 'Over '+(r.minInclusive?'':'')+ (r.minH||0) +'h'+ (r.maxH&&r.maxH<24?' up to '+r.maxH+'h':' or more');
    const valTxt = r.action==='fullday' ? 'Full day\u2019s rate' : (r.action==='fixed' ? '$'+(r.value||0) : (r.value||0)+'%');
    const off = r.enabled===false;
    return '<div style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--cream-dark);border-radius:var(--r2);margin-bottom:6px;background:'+(off?'var(--cream)':'var(--white)')+';'+(off?'opacity:.6':'')+'">'
      + '<div style="display:flex;flex-direction:column;gap:2px">'
        + '<button onclick="lateRuleMove('+idx+',-1)" '+(idx===0?'disabled':'')+' title="Move up" style="border:none;background:none;cursor:pointer;font-size:11px;color:var(--ink-faint);padding:0;line-height:1">\u25b2</button>'
        + '<button onclick="lateRuleMove('+idx+',1)" '+(idx===lateRulesDraft.length-1?'disabled':'')+' title="Move down" style="border:none;background:none;cursor:pointer;font-size:11px;color:var(--ink-faint);padding:0;line-height:1">\u25bc</button>'
      + '</div>'
      + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:13px;font-weight:600;color:var(--ink)">'+esc(r.label||'Late checkout')+'</div>'
        + '<div style="font-size:11px;color:var(--ink-faint)">'+esc(rangeTxt)+' \u2192 '+esc(valTxt)+(r.stack?' \u00b7 stacks':' \u00b7 stops')+'</div>'
      + '</div>'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--ink-faint);cursor:pointer" title="Enable/disable">'
        + '<input type="checkbox" '+(off?'':'checked')+' onchange="lateRuleToggle('+idx+')"> on</label>'
      + '<button class="btn btn-o sm" style="font-size:11px;padding:4px 8px" onclick="lateRuleEdit('+idx+')">Edit</button>'
      + '<button class="btn btn-o sm" style="font-size:11px;padding:4px 8px;color:var(--danger)" onclick="lateRuleDelete('+idx+')">\u2715</button>'
      + '</div>';
  }).join('');

  host.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
      + '<label style="font-size:13px;font-weight:600;color:var(--ink)">Late-checkout rules</label>'
      + '<button class="btn btn-o sm" style="font-size:12px" onclick="lateRuleEdit(-1)">+ Add rule</button>'
    + '</div>'
    + '<div style="font-size:11px;color:var(--ink-faint);margin-bottom:10px;line-height:1.5">Rules apply to the leftover time after each full 24h period, evaluated top to bottom. A \u201cstops\u201d rule ends evaluation once it matches; a \u201cstacks\u201d rule also lets later rules apply. Changes save when you click <strong>Save Settings</strong>.</div>'
    + (rows || '<div style="font-size:12px;color:var(--ink-faint);padding:10px 0">No rules \u2014 no extra charge for late checkout.</div>')
    + '<div id="late-rule-editor"></div>';
}

function lateRuleMove(idx,dir){
  const j=idx+dir;
  if(j<0||j>=lateRulesDraft.length) return;
  const tmp=lateRulesDraft[idx]; lateRulesDraft[idx]=lateRulesDraft[j]; lateRulesDraft[j]=tmp;
  renderLateRules();
}
function lateRuleToggle(idx){
  if(!lateRulesDraft[idx]) return;
  lateRulesDraft[idx].enabled = lateRulesDraft[idx].enabled===false ? true : false;
  renderLateRules();
}
function lateRuleDelete(idx){
  if(!confirm('Delete this rule?')) return;
  lateRulesDraft.splice(idx,1);
  renderLateRules();
}

function lateRuleEdit(idx){
  const isNew = idx<0;
  const r = isNew
    ? {minH:3, maxH:8, action:'percent', value:50, label:'Late checkout', stack:false, enabled:true}
    : JSON.parse(JSON.stringify(lateRulesDraft[idx]));
  const ed=document.getElementById('late-rule-editor');
  if(!ed) return;
  const opt=function(v,cur,txt){ return '<option value="'+v+'" '+(cur===v?'selected':'')+'>'+txt+'</option>'; };
  ed.innerHTML =
    '<div style="border:1.5px solid var(--brown);border-radius:var(--r2);padding:14px;margin-top:8px;background:var(--white)">'
      + '<div style="font-size:13px;font-weight:600;margin-bottom:10px">'+(isNew?'New rule':'Edit rule')+'</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">'
        + '<div><label style="font-size:11px;color:var(--ink-mid)">From (hours over)</label><input type="number" id="lr-min" value="'+(r.minH||0)+'" step="0.5" min="0" max="24" style="width:100%;padding:7px 9px;border:1px solid var(--cream-dark);border-radius:8px"></div>'
        + '<div><label style="font-size:11px;color:var(--ink-mid)">Up to (hours over)</label><input type="number" id="lr-max" value="'+(r.maxH!=null?r.maxH:24)+'" step="0.5" min="0" max="24" style="width:100%;padding:7px 9px;border:1px solid var(--cream-dark);border-radius:8px"></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">'
        + '<div><label style="font-size:11px;color:var(--ink-mid)">Charge</label><select id="lr-action" onchange="lateRuleActionChange()" style="width:100%;padding:7px 9px;border:1px solid var(--cream-dark);border-radius:8px">'
          + opt('percent',r.action,'Percentage of daily rate')
          + opt('fixed',r.action,'Fixed amount ($)')
          + opt('fullday',r.action,'Full day\u2019s price')
          + '</select></div>'
        + '<div id="lr-value-wrap"><label style="font-size:11px;color:var(--ink-mid)">Value</label><input type="number" id="lr-value" value="'+(r.value||0)+'" step="1" min="0" style="width:100%;padding:7px 9px;border:1px solid var(--cream-dark);border-radius:8px"></div>'
      + '</div>'
      + '<div style="margin-bottom:10px"><label style="font-size:11px;color:var(--ink-mid)">Invoice label</label><input type="text" id="lr-label" value="'+esc(r.label||'')+'" placeholder="e.g. Late checkout (full day)" style="width:100%;padding:7px 9px;border:1px solid var(--cream-dark);border-radius:8px"></div>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-mid);margin-bottom:6px;cursor:pointer"><input type="checkbox" id="lr-mininc" '+(r.minInclusive?'checked':'')+'> Include the exact \u201cFrom\u201d hour in this rule (\u2265 instead of &gt;)</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-mid);margin-bottom:12px;cursor:pointer"><input type="checkbox" id="lr-stack" '+(r.stack?'checked':'')+'> Let later rules also apply (stack) instead of stopping here</label>'
      + '<div style="display:flex;gap:8px">'
        + '<button class="btn btn-p sm" onclick="lateRuleSave('+idx+')">'+(isNew?'Add rule':'Save rule')+'</button>'
        + '<button class="btn btn-o sm" onclick="lateRuleCancelEdit()">Cancel</button>'
      + '</div>'
    + '</div>';
  lateRuleActionChange();
}

function lateRuleActionChange(){
  const act=(document.getElementById('lr-action')||{}).value;
  const wrap=document.getElementById('lr-value-wrap');
  if(!wrap) return;
  // Full-day action needs no value
  wrap.style.display = act==='fullday' ? 'none' : '';
}

function lateRuleCancelEdit(){ const ed=document.getElementById('late-rule-editor'); if(ed) ed.innerHTML=''; }

function lateRuleSave(idx){
  const minH=parseFloat((document.getElementById('lr-min')||{}).value)||0;
  const maxH=parseFloat((document.getElementById('lr-max')||{}).value); 
  const action=(document.getElementById('lr-action')||{}).value||'percent';
  const value=parseFloat((document.getElementById('lr-value')||{}).value)||0;
  const label=((document.getElementById('lr-label')||{}).value||'').trim()||'Late checkout';
  const stack=!!(document.getElementById('lr-stack')||{}).checked;
  const minInclusive=!!(document.getElementById('lr-mininc')||{}).checked;
  if(isNaN(maxH)){ toast('Please set an \u201cup to\u201d value.', true); return; }
  if(maxH<=minH){ toast('\u201cUp to\u201d must be greater than \u201cfrom\u201d.', true); return; }
  if(action!=='fullday' && value<=0){ toast('Please enter a charge value.', true); return; }
  const rule={minH, maxH, action, value, label, stack, minInclusive, enabled:true};
  if(idx<0) lateRulesDraft.push(rule);
  else { rule.enabled = lateRulesDraft[idx].enabled!==false; lateRulesDraft[idx]=rule; }
  lateRuleCancelEdit();
  renderLateRules();
}

// Called by saveSettings() to persist the draft into settings.
function lateRulesCommit(target){
  if(lateRulesDraft!==null) target.lateRules = JSON.parse(JSON.stringify(lateRulesDraft));
}

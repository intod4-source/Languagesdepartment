/* CULTURE ENGLISH UI + URDU NASTALEEQ EDITOR */
(function(){
  const font=document.createElement('link');
  font.rel='stylesheet';
  font.href='https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap';
  document.head.appendChild(font);
  const style=document.createElement('style');
  style.textContent=`
    .ca{direction:ltr!important;text-align:left!important}
    .ca [dir="rtl"],.ca .ur-text,.ca-section h3,.ca-section p,
    .ca-editor [data-heading],.ca-editor [data-body],.ca-editor #ceSummary{
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif!important;
      direction:rtl!important;text-align:right!important
    }
    .ca-section p{line-height:2.25!important;text-align:justify!important;font-size:17px}
    .ca-editor textarea,.ca-editor input[data-heading]{
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif!important;
      direction:rtl!important;text-align:right!important;line-height:2.15!important;font-size:17px!important
    }
    #caQuiz{
      background:#d89114!important;border-color:#a96800!important;
      color:#fff!important;font-weight:900!important;letter-spacing:.7px!important;
      padding:14px 20px!important;box-shadow:0 8px 20px #b8750366!important
    }
    .ca-editor-toolbar{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 18px}
    .ca-editor-toolbar button{border:1px solid #c8ded6;background:#fff;border-radius:8px;padding:8px 11px;cursor:pointer}
    .ca-editor-toolbar button:hover{background:#e8f5ef}
  `;
  document.head.appendChild(style);
  L={All:'All Countries',Asia:'Asia',Africa:'Africa',Europe:'Europe',Americas:'Americas',Oceania:'Oceania'};
  home=function(a){
    return `<div class="ca">
      <section class="ca-hero">
        <div class="ca-k">LANGUAGES DEPARTMENT · GLOBAL LEARNING CENTRE</div>
        <h2>Country Culture Academy</h2>
        <p>Study local culture, etiquette and practical guidance before starting country-based work, then complete the 100-question assessment.</p>
        <div class="ca-stats">
          <div class="ca-stat"><b>${a.length}</b><span>Country Guides</span></div>
          <div class="ca-stat"><b>${TOTAL}</b><span>Questions / Marks</span></div>
          <div class="ca-stat"><b>${PASS}</b><span>Passing Marks</span></div>
        </div>
      </section>
      <div class="ca-tools">
        <input class="input ca-search" id="caSearch" placeholder="Search country or region…" value="${esc(filters.cultureSearch||'')}">
        <button class="btn btn-secondary" id="caClear">Clear</button>
      </div>
      <div class="ca-tabs">${Object.keys(L).map(x=>`<button class="ca-tab ${region===x?'active':''}" data-region="${x}">${L[x]}</button>`).join('')}</div>
      <div class="ca-grid">${a.map(c=>`
        <button class="ca-card" data-country="${esc(c.slug)}">
          <div class="ca-top"><span class="ca-flag">${esc(c.flag)}</span><span class="ca-region">${L[area(c.name)]||area(c.name)}</span></div>
          <div class="ca-body"><h3>${esc(c.name)}</h3><p>${esc(c.summary||'Country culture guidance')}</p><div class="ca-foot"><span>Read Guide</span><span>→</span></div></div>
        </button>`).join('')||'<div class="ca-empty">No country found.</div>'}
      </div>
    </div>`;
  };
  guide=function(c){
    let sections=(c.sections||[]).map(x=>`
      <article class="ca-section" dir="rtl">
        <h3>${esc(x.heading)}</h3>
        <p>${esc(x.body)}</p>
      </article>`).join('');
    return `<div class="ca">
      <button class="btn btn-secondary ca-back" id="caBack">← Back to Academy</button>
      <section class="ca-country">
        <span class="ca-flag">${esc(c.flag)}</span>
        <div>
          <div class="ca-k" style="color:#0b735f">${L[area(c.name)]||area(c.name)} · CULTURE GUIDE</div>
          <h2>${esc(c.name)}</h2>
          <p>${esc(c.summary||'Study the guide, then complete the 100-question assessment. The passing score is 70 marks.')}</p>
        </div>
        <button class="btn btn-primary" id="caQuiz">START 100-QUESTION TEST</button>
      </section>
      <div class="ca-layout">
        <div class="ca-section" style="margin-top:0">
          <h3 style="font-family:Arial,Tahoma,sans-serif;direction:ltr;text-align:left">Learning Method</h3>
          <p style="font-family:Arial,Tahoma,sans-serif;direction:ltr;text-align:left">
            Read the complete guide carefully. Each question carries one mark; the total is 100 marks and 70 marks are required to pass.
          </p>
        </div>
        <aside class="ca-tip">
          <b>Important Note</b>
          <p style="font-family:Arial,Tahoma,sans-serif;direction:ltr;text-align:left">
            Respect local etiquette, language and social sensitivities in all country-based work.
          </p>
        </aside>
      </div>

      ${sections}
      ${isAdmin()?'<button class="btn btn-secondary" id="caEdit">✎ Edit This Guide</button>':''}
    </div>`;
  };
  editor=function(c){
    let rows=(c.sections||[]).map((s,i)=>`
      <div class="ca-edit-card" data-edit-section="${i}">
        <label>Section Heading</label>
        <input data-heading value="${esc(s.heading)}">
        <label>Urdu Text</label>
        <textarea data-body>${esc(s.body)}</textarea>
        <button class="btn btn-secondary" data-remove="${i}">Remove Section</button>
      </div>`).join('');
    return `<div class="ca">
      <button class="btn btn-secondary ca-back" id="caCancelEdit">← Cancel without Saving</button>
      <section class="ca-editor">
        <div class="ca-k" style="color:#0b735f">ADMINISTRATION · GUIDE EDITOR</div>
        <h2>Edit ${esc(c.name)} Guide</h2>
        <p class="ca-small">Urdu fields are right-to-left and use Noori Nastaleeq style. Use the editor controls below to review the formatting.</p>
        <div class="ca-editor-toolbar">
          <button type="button" data-format="right">Right Align</button>
          <button type="button" data-format="justify">Justify Text</button>
          <button type="button" data-format="large">Large Text</button>
          <button type="button" data-format="normal">Normal Text</button>
        </div>
        <label>Country Name</label>
        <input id="ceName" value="${esc(c.name)}">
        <label>Short Introduction</label>
        <textarea id="ceSummary">${esc(c.summary||'')}</textarea>
        <div id="ceSections">${rows}</div>
        <div class="ca-edit-row">
          <button class="btn btn-secondary" id="ceAdd">+ Add New Section</button>
          <button class="btn btn-primary" id="ceSave">✓ Save Changes</button>
        </div>
      </section>
    </div>`;
  };

  bindEditor=function(c){
    let host=$('#ceSections');
    function applyFormat(type){
      let active=document.activeElement;
      if(!active || !active.matches('textarea,input')) return;
      if(type==='right'){active.style.textAlign='right'}
      if(type==='justify'){active.style.textAlign='justify'}
      if(type==='large'){active.style.fontSize='20px'}
      if(type==='normal'){active.style.fontSize='17px'}
    }
    document.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>applyFormat(b.dataset.format));
    $('#ceAdd').onclick=()=>{
      let n=document.createElement('div');
      n.className='ca-edit-card';
      n.innerHTML='<label>Section Heading</label><input data-heading value="New Heading"><label>Urdu Text</label><textarea data-body></textarea><button class="btn btn-secondary" data-remove>Remove Section</button>';
      host.appendChild(n);
      n.querySelector('[data-remove]').onclick=()=>n.remove();
    };
    host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>b.closest('.ca-edit-card').remove());
    $('#caCancelEdit').onclick=()=>{editing=null;render()};
    $('#ceSave').onclick=async()=>{
      let b=$('#ceSave');
      b.disabled=true;
      b.textContent='Saving…';
      let g={
        ...c,
        name:$('#ceName').value.trim()||c.name,
        summary:$('#ceSummary').value.trim(),
        sections:[...host.querySelectorAll('.ca-edit-card')].map(x=>({
          heading:x.querySelector('[data-heading]').value.trim(),
          body:x.querySelector('[data-body]').value.trim()
        })).filter(x=>x.heading||x.body)
      };
      try{
        let r=await fetch(URL+'/rest/v1/culture_guide_overrides?on_conflict=country_slug',{
          method:'POST',
          headers:{...apiHeaders(),Prefer:'resolution=merge-duplicates,return=representation'},
          body:JSON.stringify({
            country_slug:c.slug,
            guide:g,
            updated_by:A.user.id,
            updated_at:new Date().toISOString()
          })
        });
        if(!r.ok)throw Error('Could not save changes. Please try again.');
        editing=null;
        selected=c.slug;
        await render();
      }catch(e){
        b.disabled=false;
        b.textContent='✓ Save Changes';
        alert(e.message);
      }
    };
  };
  qpage=function(){
    let x=quiz.a[quiz.i],p=Math.round(quiz.i/TOTAL*100);
    return `<div class="ca">
      <button class="btn btn-secondary ca-back" id="caExit">← Back to Guide</button>
      <section class="ca-quiz">
        <div class="ca-qtop">
          <div><div class="ca-k" style="color:#0b735f">${esc(quiz.c.name)} · CULTURE TEST</div><b>Question ${quiz.i+1} of ${TOTAL}</b></div>
          <small>1 Mark per Question</small>
        </div>
        <div class="ca-bar"><i style="width:${p}%"></i></div>
        <div class="ca-question" dir="rtl" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;text-align:right">${esc(x.q)}</div>
        <div class="ca-options">${x.o.map((o,i)=>`<button class="ca-option" data-a="${i}" dir="rtl" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;text-align:right"><b>${['الف','ب','ج','د'][i]}۔</b> ${esc(o)}</button>`).join('')}</div>
      </section>
    </div>`;
  };
})();

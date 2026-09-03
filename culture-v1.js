(function(){
'use strict';
const ROOT='./',TOTAL=100,PASS=70;
const REGIONS={Asia:'Afghanistan Armenia Azerbaijan Cambodia India Indonesia Iran Iraq Jordan Kazakhstan Kuwait Kyrgyzstan Maldives Myanmar Oman Saudi-Arabia South-Korea Syria Tajikistan United-Arab-Emirates Uzbekistan Vietnam Yemen',Africa:'Algeria Angola Botswana Cameroon Chad Egypt Gambia Kenya Liberia Madagascar Malawi Mali Mauritius Niger Nigeria Senegal Sierra-Leone Somalia Sudan Tanzania Uganda Zambia Zimbabwe',Europe:'Albania Andorra Austria Belgium Denmark Greece Iceland Ireland Netherlands Norway Poland Portugal Romania Russia Serbia Sweden Switzerland Ukraine United-Kingdom',Americas:'Argentina Bermuda Bolivia Brazil Canada Chile Colombia Cuba Guatemala Guyana Haiti Suriname Trinidad-and-Tobago Uruguay Venezuela',Oceania:'Australia Fiji New-Zealand'};
let countries=[],chosen=null,quiz=null,editing=false,showResults=false;
const $=q=>document.querySelector(q);
const safe=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const region=n=>Object.keys(REGIONS).find(r=>REGIONS[r].split(' ').includes(String(n).replaceAll(' ','-')))||'Global';
const headers=()=>({apikey:KEY,Authorization:'Bearer '+A.access_token,'Content-Type':'application/json'});

function addStyle(){
const link=document.createElement('link');
link.rel='stylesheet';
link.href='https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap';
document.head.appendChild(link);
const s=document.createElement('style');
s.textContent=`
.culture{max-width:1200px;margin:auto;font-family:Arial,sans-serif;color:#173c34}
.culture-hero{background:linear-gradient(120deg,#063b3a,#087463,#d79b2e);color:#fff;padding:32px;border-radius:24px}
.culture-hero h2{font-size:34px;margin:7px 0}
.culture-stats,.culture-tools,.culture-tabs{display:flex;gap:10px;flex-wrap:wrap}
.culture-stats{margin-top:20px}
.culture-stats span{background:#ffffff18;border:1px solid #ffffff35;border-radius:11px;padding:9px 13px}
.culture-tools{margin:18px 0}
.culture-tools input{flex:1;min-width:220px;padding:11px;border:1px solid #cdded8;border-radius:9px}
.culture-tabs{margin-bottom:17px}
.culture-tabs button{background:#fff;border:1px solid #cbded7;border-radius:30px;padding:8px 13px;cursor:pointer}
.culture-tabs button.active{background:#08715f;color:#fff}
.culture-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.culture-card{background:#fff;border:1px solid #d6e6e1;border-radius:17px;padding:0;text-align:left;overflow:hidden;cursor:pointer}
.culture-card:hover{transform:translateY(-3px);box-shadow:0 12px 25px #164a3e20}
.culture-card-top{background:linear-gradient(130deg,#e8f5f0,#fff2d9);padding:14px;display:flex;justify-content:space-between;align-items:center}
.culture-flag{font-size:42px}
.culture-card-body{padding:14px}
.culture-card h3{margin:0 0 7px}
.culture-card p{height:38px;overflow:hidden;color:#647d76;font-size:12px}
.culture-country{display:flex;gap:17px;align-items:center;background:#eef8f4;border:1px solid #cee5dc;border-radius:20px;padding:22px}
.culture-country h2{margin:0}
.culture-country .btn{margin-left:auto}
#cultureTest{background:#d88c0b!important;color:#fff!important;font-weight:900!important;padding:14px 20px!important;box-shadow:0 8px 20px #b8750350}
.culture-urdu,.culture-section h3,.culture-section p,.culture-editor .urdu-field{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;text-align:right}
.culture-section{background:#fff;border:1px solid #d8e7e2;border-radius:16px;padding:20px;margin:14px 0}
.culture-section h3{color:#08705e;margin:0 0 12px;border-bottom:2px solid #e1f0eb;padding-bottom:9px}
.culture-section p{font-size:17px;line-height:2.2;text-align:justify;white-space:pre-line;margin:0}
.culture-quiz,.culture-editor{max-width:850px;margin:15px auto;background:#fff;border:1px solid #d5e6e0;border-radius:20px;padding:25px}
.culture-progress{height:8px;background:#e5efec;border-radius:8px;overflow:hidden;margin:16px 0}
.culture-progress i{display:block;height:100%;background:#09806b}
.culture-option{display:block;width:100%;padding:13px;margin:9px 0;border:1px solid #d4e5df;border-radius:11px;background:#fff;cursor:pointer}
.culture-option:hover{background:#eaf7f2}
.culture-editor input,.culture-editor textarea{box-sizing:border-box;width:100%;padding:11px;margin:6px 0 13px;border:1px solid #cadfd7;border-radius:9px}
.culture-editor textarea{min-height:130px}
.culture-edit-card{border:1px solid #d8e7e2;padding:14px;border-radius:13px;margin:12px 0}
.culture-row{display:flex;gap:9px;flex-wrap:wrap}
.culture-empty{text-align:center;padding:35px;color:#667e77}
@media(max-width:700px){.culture-grid{grid-template-columns:1fr 1fr}.culture-country{flex-wrap:wrap}.culture-country .btn{margin:0}.culture-hero{padding:22px}}
`;
document.head.appendChild(s);
}

async function catalogue(){
if(countries.length)return countries;
const r=await fetch(ROOT+'index.json',{cache:'no-store'});
if(!r.ok)throw Error('Country list could not load.');
countries=await r.json();
return countries;
}

async function getGuide(slug){
const r=await fetch(ROOT+slug+'.json',{cache:'no-store'});
if(!r.ok)throw Error('This country guide could not load.');
let guide=await r.json();
try{
const x=await fetch(URL+'/rest/v1/culture_guide_overrides?country_slug=eq.'+encodeURIComponent(slug)+'&select=guide',{headers:headers()});
if(x.ok){
const rows=await x.json();
if(rows[0]?.guide)guide=rows[0].guide;
}
}catch(e){console.warn(e)}
return guide;
}

function home(list){
return `<div class="culture">
<section class="culture-hero">
<small>LANGUAGES DEPARTMENT · GLOBAL LEARNING CENTRE</small>
<h2>Country Culture Academy</h2>
<p>Choose a country, study its culture guide and complete the assessment.</p>
<div class="culture-stats">
<span><b>${list.length}</b> Country Guides</span>
<span><b>100</b> Questions / Marks</span>
<span><b>70</b> Passing Marks</span>
</div>
</section>
<div class="culture-tools">
<input id="cultureSearch" placeholder="Search country…">
<button class="btn btn-secondary" id="cultureClear">Clear</button>
</div>
<div class="culture-tabs">
${['All','Asia','Africa','Europe','Americas','Oceania'].map(x=>`<button data-region="${x}" class="${window.cultureRegion===x?'active':''}">${x}</button>`).join('')}
</div>
<div class="culture-grid">
${list.map(c=>`<button class="culture-card" data-country="${safe(c.slug)}">
<div class="culture-card-top"><span class="culture-flag">${safe(c.flag)}</span><small>${region(c.name)}</small></div>
<div class="culture-card-body"><h3>${safe(c.name)}</h3><p class="culture-urdu">${safe(c.summary||'ملکی ثقافتی رہنمائی')}</p><b>Read Guide →</b></div>
</button>`).join('')||'<div class="culture-empty">No country found.</div>'}
</div></div>`;
}

function guidePage(c){
return `<div class="culture">
<button class="btn btn-secondary" id="cultureBack">← Back to Academy</button>
<section class="culture-country">
<span class="culture-flag">${safe(c.flag)}</span>
<div><small>${region(c.name)} · CULTURE GUIDE</small><h2>${safe(c.name)}</h2><p class="culture-urdu">${safe(c.summary||'ملکی ثقافتی رہنمائی')}</p></div>
<button class="btn btn-primary" id="cultureTest">START 100-QUESTION TEST</button>
</section>
${(c.sections||[]).map(s=>`<article class="culture-section"><h3>${safe(s.heading)}</h3><p>${safe(s.body)}</p></article>`).join('')}
${isAdmin()?'<button class="btn btn-secondary" id="cultureEdit">✎ Edit This Guide</button>':''}
</div>`;
}

function makeQuestions(c){
let heads=(c.sections||[]).map(s=>s.heading).filter(Boolean);
let bank=(c.sections||[]).filter(s=>s.body).map((s,i)=>({
q:`درج ذیل معلومات کس عنوان سے متعلق ہیں؟\n\n${String(s.body).replace(/\s+/g,' ').slice(0,130)}…`,
answer:s.heading,
options:shuffle([s.heading,...heads.filter(x=>x!==s.heading).slice(i,i+3),'عمومی معلومات']).slice(0,4)
}));
if(!bank.length)bank=[{q:'کیا آپ نے کلچر گائیڈ مکمل پڑھ لی ہے؟',answer:'جی ہاں',options:['جی ہاں','نہیں','جزوی طور پر','یاد نہیں']}];
return Array.from({length:TOTAL},(_,i)=>{
let x=bank[i%bank.length],o=[...new Set([x.answer,...x.options])];
while(o.length<4)o.push('دیگر معلومات');
return {...x,options:shuffle(o.slice(0,4))};
});
}

function quizPage(){
let x=quiz.questions[quiz.index],progress=Math.round(quiz.index/TOTAL*100);
return `<div class="culture">
<button class="btn btn-secondary" id="quizExit">← Back to Guide</button>
<section class="culture-quiz">
<div><b>Question ${quiz.index+1} of ${TOTAL}</b><span style="float:right">1 Mark</span></div>
<div class="culture-progress"><i style="width:${progress}%"></i></div>
<h3 class="culture-urdu" style="white-space:pre-line">${safe(x.q)}</h3>
${x.options.map(o=>`<button class="culture-option culture-urdu" data-answer="${safe(o)}">${safe(o)}</button>`).join('')}
</section></div>`;
}

async function saveResult(){
try{
await fetch(URL+'/rest/v1/culture_quiz_results',{
method:'POST',
headers:{...headers(),Prefer:'return=minimal'},
body:JSON.stringify({user_id:A.user.id,user_name:session?.name||A.user.email,country:quiz.country.name,score:quiz.score,total:TOTAL})
});
}catch(e){console.warn(e)}
}

function resultPage(){
let passed=quiz.score>=PASS;
return `<div class="culture"><section class="culture-quiz" style="text-align:center">
<h2>${passed?'Congratulations — Passed':'Assessment Not Passed'}</h2>
<h1>${quiz.score} / ${TOTAL}</h1>
<p>Passing score: ${PASS}</p>
<button class="btn btn-primary" id="quizDone">Return to Guide</button>
</section></div>`;
}

function editorPage(c){
return `<div class="culture">
<button class="btn btn-secondary" id="editCancel">← Cancel</button>
<section class="culture-editor">
<small>ADMINISTRATION · GUIDE EDITOR</small>
<h2>Edit ${safe(c.name)}</h2>
<label>Country Name</label>
<input id="editName" value="${safe(c.name)}">
<label>Short Introduction</label>
<textarea class="urdu-field" id="editSummary">${safe(c.summary||'')}</textarea>
<div id="editSections">
${(c.sections||[]).map(s=>`<div class="culture-edit-card">
<label>Section Heading</label>
<input class="urdu-field" data-heading value="${safe(s.heading)}">
<label>Urdu Text</label>
<textarea class="urdu-field" data-body>${safe(s.body)}</textarea>
<button class="btn btn-secondary" data-remove>Remove Section</button>
</div>`).join('')}
</div>
<div class="culture-row">
<button class="btn btn-secondary" id="addSection">+ Add Section</button>
<button class="btn btn-primary" id="saveGuide">Save Changes</button>
</div>
</section></div>`;
}

function bindEditor(c){
const box=$('#editSections');
box.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>b.parentElement.remove());
$('#addSection').onclick=()=>{
let d=document.createElement('div');
d.className='culture-edit-card';
d.innerHTML='<label>Section Heading</label><input class="urdu-field" data-heading><label>Urdu Text</label><textarea class="urdu-field" data-body></textarea><button class="btn btn-secondary" data-remove>Remove Section</button>';
box.appendChild(d);
d.querySelector('[data-remove]').onclick=()=>d.remove();
};
$('#editCancel').onclick=()=>{editing=false;renderCulture()};
$('#saveGuide').onclick=async()=>{
let b=$('#saveGuide');
b.disabled=true;
b.textContent='Saving…';
const updated={
...c,
name:$('#editName').value.trim()||c.name,
summary:$('#editSummary').value.trim(),
sections:[...box.children].map(d=>({
heading:d.querySelector('[data-heading]').value.trim(),
body:d.querySelector('[data-body]').value.trim()
})).filter(s=>s.heading||s.body)
};
const r=await fetch(URL+'/rest/v1/culture_guide_overrides?on_conflict=country_slug',{
method:'POST',
headers:{...headers(),Prefer:'resolution=merge-duplicates,return=minimal'},
body:JSON.stringify({country_slug:c.slug,guide:updated,updated_by:A.user.id,updated_at:new Date().toISOString()})
});
if(!r.ok){
b.disabled=false;
b.textContent='Save Changes';
return alert('Changes could not be saved.');
}
editing=false;
renderCulture();
};
}

async function resultsPage(){
const r=await fetch(URL+'/rest/v1/culture_quiz_results?select=user_name,country,score,total,completed_at&order=completed_at.desc&limit=200',{headers:headers()});
const rows=r.ok?await r.json():[];
return `<div class="culture">
<button class="btn btn-secondary" id="resultsBack">← Back</button>
<section class="culture-hero"><h2>Culture Test Results</h2></section>
<div class="culture-section" style="overflow:auto">
<table style="width:100%">
<tr><th>User</th><th>Country</th><th>Score</th><th>Result</th></tr>
${rows.map(x=>`<tr><td>${safe(x.user_name)}</td><td>${safe(x.country)}</td><td>${x.score}/${x.total}</td><td>${x.score>=PASS?'Passed':'Failed'}</td></tr>`).join('')}
</table></div></div>`;
}

async function renderCulture(){
const host=$('#content');
if(!host)return;
host.innerHTML='<div class="culture-empty">Loading Country Culture…</div>';
try{
let all=await catalogue();

if(showResults){
host.innerHTML=await resultsPage();
$('#resultsBack').onclick=()=>{showResults=false;renderCulture()};
return;
}

if(quiz){
if(quiz.index>=TOTAL){
host.innerHTML=resultPage();
$('#quizDone').onclick=()=>{chosen=quiz.country.slug;quiz=null;renderCulture()};
return;
}
host.innerHTML=quizPage();
$('#quizExit').onclick=()=>{chosen=quiz.country.slug;quiz=null;renderCulture()};
host.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
if(b.dataset.answer===quiz.questions[quiz.index].answer)quiz.score++;
quiz.index++;
if(quiz.index===TOTAL)saveResult();
renderCulture();
});
return;
}

if(chosen){
let c=await getGuide(chosen);
if(editing){
host.innerHTML=editorPage(c);
bindEditor(c);
return;
}
host.innerHTML=guidePage(c);
$('#cultureBack').onclick=()=>{chosen=null;renderCulture()};
$('#cultureTest').onclick=()=>{quiz={country:c,questions:makeQuestions(c),index:0,score:0};renderCulture()};
let edit=$('#cultureEdit');
if(edit)edit.onclick=()=>{editing=true;renderCulture()};
return;
}

let q=String(window.cultureSearch||'').toLowerCase();
let selectedRegion=window.cultureRegion||'All';
let filtered=all.filter(c=>
(selectedRegion==='All'||region(c.name)===selectedRegion)&&
(!q||c.name.toLowerCase().includes(q)||String(c.summary||'').includes(q))
);

host.innerHTML=home(filtered);
$('#cultureSearch').value=window.cultureSearch||'';
$('#cultureSearch').oninput=e=>{window.cultureSearch=e.target.value;renderCulture()};
$('#cultureClear').onclick=()=>{window.cultureSearch='';renderCulture()};
host.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>{window.cultureRegion=b.dataset.region;renderCulture()});
host.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{chosen=b.dataset.country;renderCulture()});

if(isAdmin()){
let b=document.createElement('button');
b.className='btn btn-primary';
b.textContent='Culture Results Dashboard';
$('#cultureClear').after(b);
b.onclick=()=>{showResults=true;renderCulture()};
}
}catch(e){
host.innerHTML='<div class="notice">'+safe(e.message)+'</div>';
}
}

function install(){
if(typeof pages==='undefined'||typeof NAV_ADMIN==='undefined'||typeof NAV_MEMBER==='undefined'){
return setTimeout(install,100);
}
window.cultureRegion='All';
addStyle();
if(!NAV_ADMIN.some(x=>x[0]==='culture'))NAV_ADMIN.splice(1,0,['culture','Country Culture','◈']);
if(!NAV_MEMBER.some(x=>x[0]==='culture'))NAV_MEMBER.splice(1,0,['culture','Country Culture','◈']);
pages.culture=()=>{
setTimeout(renderCulture,0);
return '<div class="culture-empty">Loading Country Culture…</div>';
};
if(typeof session!=='undefined'&&session)renderNav();
}
install();
})();

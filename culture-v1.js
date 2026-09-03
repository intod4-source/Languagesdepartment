(function(){
'use strict';
const ROOT='./',TOTAL=100,PASS=70;
const G={Asia:'|Afghanistan|Armenia|Azerbaijan|Cambodia|India|Indonesia|Iran|Iraq|Jordan|Kazakhstan|Kuwait|Kyrgyzstan|Maldives|Myanmar|North Korea|Oman|Saudi Arabia|South Korea|Syria|Tajikistan|United Arab Emirates|Uzbekistan|Vietnam|Yemen|',Africa:'|Algeria|Angola|Botswana|Cameroon|Chad|Egypt|Gambia|Kenya|Liberia|Madagascar|Malawi|Mali|Mauritius|Niger|Nigeria|Senegal|Sierra Leone|Somalia|Sudan|Tanzania|Uganda|Zambia|Zimbabwe|',Europe:'|Albania|Andorra|Austria|Belgium|Denmark|Greece|Iceland|Ireland|Netherlands|Norway|Poland|Portugal|Romania|Russia|Serbia|Sweden|Switzerland|Ukraine|United Kingdom|',Americas:'|Argentina|Bermuda|Bolivia|Brazil|Canada|Chile|Colombia|Cuba|Guatemala|Guyana|Haiti|Suriname|Trinidad and Tobago|Uruguay|Venezuela|',Oceania:'|Australia|Fiji|New Zealand|'};
const L={All:'All Countries',Asia:'Asia',Africa:'Africa',Europe:'Europe',Americas:'Americas',Oceania:'Oceania'};
let list,selected,region='All',quiz,resultsView=false,editing=null;
const $=s=>document.querySelector(s),esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),area=n=>Object.keys(G).find(k=>G[k].includes('|'+n+'

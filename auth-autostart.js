(function(){
'use strict';
function fixText(){
  const intro=document.getElementById('ldAuthIntro');
  if(intro && /Super Admin must approve/i.test(intro.textContent||'')){
    intro.textContent='Create an account and sign in immediately as a standard user.';
  }
  const msg=document.getElementById('ldAuthMessage');
  if(msg && /pending Super Admin approval/i.test(msg.textContent||'')){
    msg.textContent='Account created successfully. You can sign in now.';
    msg.className='info';
  }
  const p=document.querySelector('#loginScreen .login-card p');
  if(p && /pending Super Admin approval/i.test(p.textContent||'')){
    p.textContent='Create an account and sign in immediately as a standard user.';
  }
}
const observer=new MutationObserver(fixText);
observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
fixText();
})();

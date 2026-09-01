(function(){
'use strict';
const URL='https://cdidgehrcnapaqdxmhok.supabase.co';
const KEY='sb_publishable_bj2ER2qqjx6bA7GA57-N3w_SNMPkooE';
const STORE='languagesDepartmentAuth_v2';
const APP_URL=location.origin+location.pathname.replace(/[^/]*$/,'');

function headers(token){
  const h={'apikey':KEY,'Content-Type':'application/json'};
  if(token)h.Authorization='Bearer '+token;
  return h;
}
function message(text,error=false){
  const el=document.getElementById('ldAuthMessage');
  if(!el)return;
  el.className=error?'notice':'info';
  el.textContent=text;
  el.classList.remove('hidden');
}
function parseHash(){
  const raw=(location.hash||'').replace(/^#/,'');
  return new URLSearchParams(raw);
}
function recoveryToken(){
  const h=parseHash();
  if(h.get('type')==='recovery'&&h.get('access_token'))return h.get('access_token');
  return null;
}
function clearRecoveryUrl(){
  try{history.replaceState({},document.title,location.pathname+location.search)}catch(e){}
}
async function requestReset(email){
  const endpoint=URL+'/auth/v1/recover?redirect_to='+encodeURIComponent(APP_URL);
  let r;
  try{
    r=await fetch(endpoint,{method:'POST',headers:headers(),body:JSON.stringify({email})});
  }catch(e){
    throw new Error('Password service is unreachable. Please check your internet connection and try again.');
  }
  let d={};
  try{d=await r.json()}catch(e){}
  if(!r.ok)throw new Error(d.msg||d.error_description||d.error||'Unable to send password reset email.');
}
async function updatePassword(token,password){
  let r;
  try{
    r=await fetch(URL+'/auth/v1/user',{method:'PUT',headers:headers(token),body:JSON.stringify({password})});
  }catch(e){
    throw new Error('Password service is unreachable. Please check your internet connection and try again.');
  }
  let d={};
  try{d=await r.json()}catch(e){}
  if(!r.ok)throw new Error(d.msg||d.error_description||d.error||'Unable to update password. The recovery link may have expired.');
  localStorage.removeItem(STORE);
  sessionStorage.removeItem('languagesSession');
  clearRecoveryUrl();
}
function showRecoveryForm(token){
  const root=document.getElementById('loginScreen');
  if(!root)return;
  root.classList.remove('hidden');
  const app=document.getElementById('app');
  if(app)app.classList.add('hidden');
  root.innerHTML=`<div class="login-card"><div class="login-logo">LD</div><h1>Set New Password</h1><p>Enter a new password for your Languages Department account.</p><form id="ldRecoveryPassword" class="form-stack"><div class="field"><label>New Password</label><input class="input" name="password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label>Confirm Password</label><input class="input" name="confirm" type="password" minlength="8" autocomplete="new-password" required></div><button class="btn btn-primary" type="submit">Update Password</button></form><div id="ldAuthMessage" class="info hidden" style="margin-top:14px"></div></div>`;
  const form=document.getElementById('ldRecoveryPassword');
  form.onsubmit=async e=>{
    e.preventDefault();
    const f=new FormData(form),p=String(f.get('password')||''),c=String(f.get('confirm')||'');
    if(p.length<8)return message('Password must be at least 8 characters.',true);
    if(p!==c)return message('Passwords do not match.',true);
    const btn=form.querySelector('button[type="submit"]');
    btn.disabled=true;
    try{
      message('Updating password…');
      await updatePassword(token,p);
      message('Password updated successfully. Reloading sign in…');
      setTimeout(()=>location.reload(),900);
    }catch(err){
      message(err.message||'Unable to update password.',true);
      btn.disabled=false;
    }
  };
}
function installForgotPassword(){
  const login=document.getElementById('ldLogin');
  if(!login||document.getElementById('ldForgotPassword'))return;
  const wrap=document.createElement('div');
  wrap.style.marginTop='10px';
  wrap.style.textAlign='center';
  wrap.innerHTML='<button type="button" id="ldForgotPassword" style="border:0;background:none;color:#176b45;cursor:pointer;font:inherit;text-decoration:underline;padding:4px 8px">Forgot password?</button>';
  login.appendChild(wrap);
  document.getElementById('ldForgotPassword').onclick=()=>showResetRequest();
}
function showResetRequest(){
  const root=document.querySelector('#loginScreen .login-card');
  if(!root)return;
  root.innerHTML=`<div class="login-logo">LD</div><h1>Reset Password</h1><p>Enter your account email. We will send you a secure password reset link.</p><form id="ldResetRequest" class="form-stack"><div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="email" required></div><button class="btn btn-primary" type="submit">Send Reset Link</button><button class="btn btn-secondary" id="ldBackToLogin" type="button">Back to Sign In</button></form><div id="ldAuthMessage" class="info hidden" style="margin-top:14px"></div>`;
  document.getElementById('ldBackToLogin').onclick=()=>location.reload();
  const form=document.getElementById('ldResetRequest');
  form.onsubmit=async e=>{
    e.preventDefault();
    const email=String(new FormData(form).get('email')||'').trim().toLowerCase();
    if(!email)return;
    const btn=form.querySelector('button[type="submit"]');
    btn.disabled=true;
    try{
      message('Sending password reset email…');
      await requestReset(email);
      message('If this email belongs to an account, a password reset link has been sent. Please also check Spam/Junk.');
    }catch(err){
      message(err.message||'Unable to send password reset email.',true);
    }finally{btn.disabled=false;}
  };
}
function showRecoveryError(){
  const h=parseHash();
  const error=h.get('error_description')||h.get('error');
  if(error){
    clearRecoveryUrl();
    setTimeout(()=>message('Password reset link error: '+error,true),0);
  }
}
function installLoggedInPasswordChange(){
  const menu=document.getElementById('accountMenu');
  if(!menu||document.getElementById('ldChangePassword'))return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.id='ldChangePassword';
  btn.textContent='Change Password';
  btn.onclick=()=>{
    menu.classList.add('hidden');
    showLoggedInChange();
  };
  menu.appendChild(btn);
}
function showLoggedInChange(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(STORE)||'null')}catch(e){}
  const token=saved&&saved.access_token;
  if(!token){alert('Please sign in again before changing your password.');return;}
  const p=prompt('Enter a new password (minimum 8 characters):');
  if(p===null)return;
  if(p.length<8){alert('Password must be at least 8 characters.');return;}
  const c=prompt('Confirm the new password:');
  if(c!==p){alert('Passwords do not match.');return;}
  updatePassword(token,p).then(()=>{alert('Password updated successfully. Please sign in again.');location.reload();}).catch(err=>alert(err.message||'Unable to update password.'));
}
function boot(){
  const token=recoveryToken();
  if(token){showRecoveryForm(token);return;}
  showRecoveryError();
  installForgotPassword();
  installLoggedInPasswordChange();
  const observer=new MutationObserver(()=>{
    installForgotPassword();
    installLoggedInPasswordChange();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
}
boot();
})();

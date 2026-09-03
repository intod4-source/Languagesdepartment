/* SINGLE USER ACCESS CONTROL PANEL */
(function(){
  window.__ldAccessSelected='';

  pages.access=function(){
    return superAdmin()
      ?pageHeader('Access Control','Select one email address, then assign its role and permissions from one control panel.')
       +'<div id="ldUsers"><div class="card empty">Loading accounts…</div></div>'
      :'<div class="card empty">Super Admin access required.</div>';
  };

  loadUsers=async function(){
    const host=document.getElementById('ldUsers');
    if(!host||!superAdmin())return;

    try{
      const all=await users();

      if(!window.__ldAccessSelected||!all.some(u=>u.user_id===window.__ldAccessSelected)){
        window.__ldAccessSelected=all[0]?.user_id||'';
      }

      const u=all.find(x=>x.user_id===window.__ldAccessSelected);

      if(!u){
        host.innerHTML='<div class="card empty">No accounts found.</div>';
        return;
      }

      const self=u.user_id===A.user.id;
      const p=u.permissions||{};

      host.innerHTML=`
        <div class="card" style="margin-bottom:12px">
          <div class="field">
            <label>Select User Email</label>
            <select id="accessPicker">
              ${all.map(x=>`<option value="${x.user_id}" ${x.user_id===u.user_id?'selected':''}>${esc(x.email)} — ${esc(x.full_name||'User')}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="card" data-uid="${u.user_id}">
          <div class="split">
            <div>
              <h3 style="margin:0 0 4px">${esc(u.full_name||u.email)}</h3>
              <div class="muted">${esc(u.email)}</div>
            </div>
            ${badge(u.status)}
          </div>

          <div class="form-grid" style="margin-top:12px">
            <div class="field">
              <label>Role</label>
              <select data-role ${self?'disabled':''}>${roleOptions(u.role,self)}</select>
            </div>

            <div class="field">
              <label>Account Status</label>
              <select data-status ${self?'disabled':''}>${statusOptions(u.status,self)}</select>
            </div>

            <div class="field full">
              <label>Link to Team Member (optional)</label>
              <select data-member>${options(state.team.map(m=>[m.id,m.name]),u.member_id||'','No linked team member')}</select>
            </div>

            <div class="subhead">Module Permissions</div>

            <div class="check-grid full">
              ${Object.entries(PERMS).map(([k,l])=>`
                <label class="check-row">
                  <input type="checkbox" data-p="${k}" ${(u.role==='super_admin'||p[k])?'checked':''} ${u.role==='super_admin'?'disabled':''}>
                  <span>${esc(l)}</span>
                  <small>${['workspace_write','data_write','data_delete'].includes(k)?'Write':'Access'}</small>
                </label>`).join('')}
            </div>
          </div>

          <div class="actions" style="margin-top:12px">
            <button class="btn btn-primary" data-save="${u.user_id}">Save Access</button>
          </div>
        </div>`;

      document.getElementById('accessPicker').onchange=e=>{
        window.__ldAccessSelected=e.target.value;
        loadUsers();
      };

      host.querySelector('[data-save]').onclick=()=>saveUser(u.user_id);

    }catch(e){
      host.innerHTML='<div class="notice">'+esc(e.message)+'</div>';
    }
  };
})();

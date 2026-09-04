(async()=>{
  try{
    const files=['./bundle/00a.txt','./bundle/00b.txt','./bundle/01a.txt','./bundle/01b.txt','./bundle/02.txt','./bundle/03.txt','./bundle/04a.txt','./bundle/04b.txt','./bundle/05a.txt','./bundle/05b.txt','./bundle/06.txt'];
    const parts=await Promise.all(files.map(async file=>{
      const r=await fetch(file,{cache:'no-store'});
      if(!r.ok) throw new Error(file+' HTTP '+r.status);
      return (await r.text()).trim();
    }));
    const raw=atob(parts.join(''));
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
    const html=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    document.open();
    document.write(html);
    document.close();
    setTimeout(()=>{
      const hint=document.querySelector('.login-help');
      if(hint) hint.remove();
      const auth=document.createElement('script');
      auth.src='./auth-v2.js?v=20260901authfix2';
      auth.onload=()=>{
        const recovery=document.createElement('script');
        recovery.src='./auth-recovery.js?v=20260901reset2';
        recovery.onload=()=>{
          const culture=document.createElement('script');
          culture.src='./culture-v1.js?v=20260904nextfix1';
          culture.onload=()=>{
            const auto=document.createElement('script');
            auto.src='./auth-autostart.js?v=20260901auto1';
            document.body.appendChild(auto);
          };
          document.body.appendChild(culture);
        };
        document.body.appendChild(recovery);
      };
      auth.onerror=()=>{
        const el=document.getElementById('msg')||document.body;
        if(el) el.textContent='Languages Department authentication module failed to load. Please refresh the page.';
      };
      document.body.appendChild(auth);
    },0);
  } catch(e) {
    const el=document.getElementById('msg');
    if(el) el.textContent='Languages Department loading error: '+String(e);
  }
})();

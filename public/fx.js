(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small=matchMedia('(max-width:700px)').matches;
  // Optional lite mode: only when YOU ask for it with ?lite=1 (remembered). ?lite=0 turns it off. Never automatic.
  const U=new URLSearchParams(location.search),q=U.get('lite');
  try{if(q==='1')localStorage.setItem('lite','1');if(q==='0')localStorage.removeItem('lite')}catch(e){}
  let lite=false;try{lite=localStorage.getItem('lite')==='1'}catch(e){}
  if(lite){const st=document.createElement('style');st.textContent='#fluid{display:none}html,body{background:#05080f}*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';document.head.appendChild(st)}

  function startFluid(){
    const c=document.getElementById('fluid');
    if(!c||reduce||lite||U.get('nofluid')==='1'||typeof window.WebGLFluid!=='function')return;
    try{
      window.WebGLFluid(c,{
        IMMEDIATE:true,AUTO:true,INTERVAL:6000,TRIGGER:'hover',SPLAT_COUNT:5,
        SIM_RESOLUTION:small?32:64,DYE_RESOLUTION:small?256:512,
        DENSITY_DISSIPATION:1.6,VELOCITY_DISSIPATION:.5,PRESSURE:.8,CURL:22,
        SPLAT_RADIUS:.28,SPLAT_FORCE:5000,SHADING:true,COLORFUL:true,COLOR_UPDATE_SPEED:6,
        BLOOM:false,SUNRAYS:false,BACK_COLOR:{r:5,g:8,b:15},TRANSPARENT:false
      });
      addEventListener('mousemove',e=>{
        if(e.target===c)return;
        c.dispatchEvent(new MouseEvent('mousemove',{clientX:e.clientX,clientY:e.clientY}));
      },{passive:true});
    }catch(err){console.warn('fluid disabled:',err)}
  }

  const GLASS='.nav,.strip,.kpis,.profile,.sidebar,.modal-box,.login-box';
  function startGlass(){
    const H=window.Hyalite;
    if(lite||U.get('noglass')==='1'||!H||typeof H.watch!=='function')return;
    try{
      H.watch(document.body,GLASS,{bevel:18,thickness:28,slope:.9,blur:6,dispersion:small?0:1,rim:1,edge:.3,materialize:reduce?0:240});
    }catch(err){console.warn('glass disabled:',err)}
  }

  const seen=new WeakSet();
  function reveal(){
    const g=window.gsap,main=document.querySelector('main');
    if(!g||reduce||!main||seen.has(main)||document.querySelector('.skel'))return;
    seen.add(main);
    const t=main.querySelectorAll('.page-head,.page>.page-title,.page>.page-sub,.strip,.grid2>*,.board-grid>*,.team-grid>*,.news-grid>*,.detail>*');
    if(!t.length)return;
    g.from([...t].slice(0,14),{opacity:0,y:14,duration:.55,stagger:.07,ease:'power2.out',clearProps:'opacity,transform'});
  }
  function watchApp(){
    const app=document.getElementById('app');
    if(!app)return;
    new MutationObserver(()=>requestAnimationFrame(reveal)).observe(app,{childList:true});
    reveal();
  }

  // Lenis smooth scroll (CDN script is optional). Off with ?nolenis=1, in lite mode, or with reduced motion.
  function startLenis(){
    if(reduce||lite||U.get('nolenis')==='1'||typeof window.Lenis!=='function')return;
    try{
      const st=document.createElement('style');
      st.textContent='html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-stopped{overflow:clip}';
      document.head.appendChild(st);
      const lenis=new window.Lenis({lerp:.12,smoothWheel:true});
      if(window.gsap){window.gsap.ticker.add(t=>lenis.raf(t*1000));window.gsap.ticker.lagSmoothing(0)}
      else{const f=t=>{lenis.raf(t);requestAnimationFrame(f)};requestAnimationFrame(f)}
      // while a popup is open, let the popup scroll natively
      const sync=()=>{const m=document.getElementById('modal');(m&&m.classList.contains('show'))?lenis.stop():lenis.start()};
      new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }catch(err){console.warn('lenis disabled:',err)}
  }

  startFluid();startGlass();startLenis();watchApp();
})();(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small=matchMedia('(max-width:700px)').matches;
  // Optional lite mode: only when YOU ask for it with ?lite=1 (remembered). ?lite=0 turns it off. Never automatic.
  const U=new URLSearchParams(location.search),q=U.get('lite');
  try{if(q==='1')localStorage.setItem('lite','1');if(q==='0')localStorage.removeItem('lite')}catch(e){}
  let lite=false;try{lite=localStorage.getItem('lite')==='1'}catch(e){}
  if(lite){const st=document.createElement('style');st.textContent='#fluid{display:none}html,body{background:#05080f}*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';document.head.appendChild(st)}

  function startFluid(){
    const c=document.getElementById('fluid');
    if(!c||reduce||lite||U.get('nofluid')==='1'||typeof window.WebGLFluid!=='function')return;
    try{
      window.WebGLFluid(c,{
        IMMEDIATE:true,AUTO:true,INTERVAL:6000,TRIGGER:'hover',SPLAT_COUNT:5,
        SIM_RESOLUTION:small?32:64,DYE_RESOLUTION:small?256:512,
        DENSITY_DISSIPATION:1.6,VELOCITY_DISSIPATION:.5,PRESSURE:.8,CURL:22,
        SPLAT_RADIUS:.28,SPLAT_FORCE:5000,SHADING:true,COLORFUL:true,COLOR_UPDATE_SPEED:6,
        BLOOM:false,SUNRAYS:false,BACK_COLOR:{r:5,g:8,b:15},TRANSPARENT:false
      });
      addEventListener('mousemove',e=>{
        if(e.target===c)return;
        c.dispatchEvent(new MouseEvent('mousemove',{clientX:e.clientX,clientY:e.clientY}));
      },{passive:true});
    }catch(err){console.warn('fluid disabled:',err)}
  }

  const GLASS='.nav,.strip,.kpis,.profile,.sidebar,.modal-box,.login-box';
  function startGlass(){
    const H=window.Hyalite;
    if(lite||U.get('noglass')==='1'||!H||typeof H.watch!=='function')return;
    try{
      H.watch(document.body,GLASS,{bevel:18,thickness:28,slope:.9,blur:6,dispersion:small?0:1,rim:1,edge:.3,materialize:reduce?0:240});
    }catch(err){console.warn('glass disabled:',err)}
  }

  const seen=new WeakSet();
  function reveal(){
    const g=window.gsap,main=document.querySelector('main');
    if(!g||reduce||!main||seen.has(main)||document.querySelector('.skel'))return;
    seen.add(main);
    const t=main.querySelectorAll('.page-head,.page>.page-title,.page>.page-sub,.strip,.grid2>*,.board-grid>*,.team-grid>*,.news-grid>*,.detail>*');
    if(!t.length)return;
    g.from([...t].slice(0,14),{opacity:0,y:14,duration:.55,stagger:.07,ease:'power2.out',clearProps:'opacity,transform'});
  }
  function watchApp(){
    const app=document.getElementById('app');
    if(!app)return;
    new MutationObserver(()=>requestAnimationFrame(reveal)).observe(app,{childList:true});
    reveal();
  }

  // Lenis smooth scroll (CDN script is optional). Off with ?nolenis=1, in lite mode, or with reduced motion.
  function startLenis(){
    if(reduce||lite||U.get('nolenis')==='1'||typeof window.Lenis!=='function')return;
    try{
      const st=document.createElement('style');
      st.textContent='html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-stopped{overflow:clip}';
      document.head.appendChild(st);
      const lenis=new window.Lenis({lerp:.12,smoothWheel:true});
      if(window.gsap){window.gsap.ticker.add(t=>lenis.raf(t*1000));window.gsap.ticker.lagSmoothing(0)}
      else{const f=t=>{lenis.raf(t);requestAnimationFrame(f)};requestAnimationFrame(f)}
      // while a popup is open, let the popup scroll natively
      const sync=()=>{const m=document.getElementById('modal');(m&&m.classList.contains('show'))?lenis.stop():lenis.start()};
      new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }catch(err){console.warn('lenis disabled:',err)}
  }

  startFluid();startGlass();startLenis();watchApp();
})();

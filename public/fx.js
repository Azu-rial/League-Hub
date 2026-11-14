(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small=matchMedia('(max-width:700px)').matches;
  // Optional lite mode: only when YOU ask for it with ?lite=1 (remembered). ?lite=0 turns it off. Never automatic.
  const q=new URLSearchParams(location.search).get('lite');
  try{if(q==='1')localStorage.setItem('lite','1');if(q==='0')localStorage.removeItem('lite')}catch(e){}
  let lite=false;try{lite=localStorage.getItem('lite')==='1'}catch(e){}
  if(lite){const st=document.createElement('style');st.textContent='#fluid{display:none}html,body{background:#05080f}*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';document.head.appendChild(st)}

  function startFluid(){
    const c=document.getElementById('fluid');
    if(!c||reduce||lite||typeof window.WebGLFluid!=='function')return;
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
    if(lite||!H||typeof H.watch!=='function')return;
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

  startFluid();startGlass();watchApp();
})();

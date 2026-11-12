
(()=>{
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small=matchMedia('(max-width:700px)').matches;

  function startFluid(){
    const c=document.getElementById('fluid');
    if(!c||reduce||typeof window.WebGLFluid!=='function')return;
    try{
      window.WebGLFluid(c,{
        IMMEDIATE:true,AUTO:true,INTERVAL:6000,TRIGGER:'hover',SPLAT_COUNT:5,
        SIM_RESOLUTION:small?64:128,DYE_RESOLUTION:small?384:768,
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

  const GLASS='.nav,.strip,.card,.match-list,.kpis,.admin-grid,.profile,.news-card,.team-card,.sidebar,.modal-box,.login-box';
  function startGlass(){
    const H=window.Hyalite;
    if(!H||typeof H.watch!=='function')return;
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

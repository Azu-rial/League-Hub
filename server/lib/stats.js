const KEYS=['goals','assists','cleanSheets','tackles','saves'];
const zero=()=>Object.fromEntries(KEYS.map(k=>[k,0]));
const num=v=>{const n=Number(v);return Number.isFinite(n)?Math.floor(n):0};

// Totals that come only from per-match stat entries (completed matches only)
function matchTotals(d){
  const t={};
  d.players.forEach(p=>{t[p.id]={...zero(),apps:0}});
  d.matches.filter(m=>m.status==='completed').forEach(m=>(m.stats||[]).forEach(e=>{
    const r=t[e.playerId]; if(!r)return;
    KEYS.forEach(k=>{r[k]+=num(e[k])}); r.apps++;
  }));
  return t;
}
// Final totals = manual "base" stats + per-match stats
function statsFor(d,limit=10){
  const mt=matchTotals(d);
  const players=d.players.filter(p=>p.active!==false).map(p=>{
    const team=d.teams.find(t=>t.id===p.teamId);
    const row={playerId:p.id,name:p.name,position:p.position||'',number:p.number||'',teamId:p.teamId||'',teamName:team?.name||'Free agent',teamShort:team?.shortName||team?.name||'',logoUrl:team?.logoUrl||'',teamColor:team?.color||'',teamTag:team?.tag||'',apps:mt[p.id].apps};
    KEYS.forEach(k=>{row[k]=Math.max(0,num(p.base?.[k])+mt[p.id][k])});
    return row;
  });
  const boards={};
  KEYS.forEach(k=>{boards[k]=players.filter(r=>r[k]>0).sort((a,b)=>b[k]-a[k]||a.name.localeCompare(b.name)).slice(0,limit)});
  const teamTops={};
  d.teams.forEach(t=>{
    teamTops[t.id]={};
    KEYS.forEach(k=>{
      const best=players.filter(r=>r.teamId===t.id&&r[k]>0).sort((a,b)=>b[k]-a[k]||a.name.localeCompare(b.name))[0];
      if(best)teamTops[t.id][k]={playerId:best.playerId,name:best.name,value:best[k]};
    });
  });
  return {keys:KEYS,players,boards,teamTops};
}
module.exports={KEYS,zero,num,matchTotals,statsFor};

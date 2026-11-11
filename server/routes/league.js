// Players, stats, signings, CSV import and season reset.
const express=require('express');
const {nanoid}=require('nanoid');
const {read,mutate}=require('../lib/db');
const {auth,owner}=require('../lib/auth');
const {KEYS,num,matchTotals,statsFor}=require('../lib/stats');
const {resetSeason}=require('../lib/seed');
const router=express.Router();
const clean=s=>String(s??'').trim();
const low=s=>clean(s).toLowerCase();
const nn=v=>Math.max(0,num(v));
const baseOf=b=>Object.fromEntries(KEYS.map(k=>[k,nn(b?.[k])]));
const ALIAS={player:'name',name:'name',team:'team',club:'team',goals:'goals',g:'goals',assists:'assists',a:'assists',ast:'assists',cleansheets:'cleanSheets',cleansheet:'cleanSheets',cs:'cleanSheets',tackles:'tackles',tkl:'tackles',saves:'saves',sv:'saves',position:'position',pos:'position',number:'number',no:'number',discordid:'discordId',discord:'discordId'};

function findTeam(d,ref){const r=low(ref);if(!r)return null;return d.teams.find(t=>t.active!==false&&(t.id===ref||low(t.name)===r||low(t.shortName)===r||low(t.tag)===r||low(t.slug)===r||(t.roleId&&t.roleId===clean(ref))))||null}
function findPlayer(d,ref){const r=low(ref);if(!r)return null;return d.players.find(p=>p.id===ref||(p.discordId&&p.discordId===clean(ref))||low(p.name)===r)||null}
function rosterError(d,teamId,exceptId){
  if(!teamId)return null;const t=d.teams.find(x=>x.id===teamId);if(!t)return 'Invalid team.';
  const max=Number(t.rosterMax||20),n=d.players.filter(p=>p.active!==false&&p.teamId===teamId&&p.id!==exceptId).length;
  return n>=max?`${t.name} roster is full (${max}/${max}).`:null;
}
function parseCSV(text){
  const first=text.split(/\r?\n/).find(l=>l.trim())||'';
  const delim=first.includes('\t')?'\t':first.includes(';')&&!first.includes(',')?';':',';
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}
    else if(c==='"')q=true;
    else if(c===delim){row.push(cell);cell=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))rows.push(row);row=[]}
    else cell+=c}
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}

router.get('/players',(req,res)=>{const d=read();res.json(d.players.filter(p=>p.active!==false))});
router.get('/players/:id',(req,res)=>{const d=read();const p=findPlayer(d,req.params.id);if(!p)return res.status(404).json({error:'Player not found'});res.json({player:p,stats:statsFor(d,1000).players.find(r=>r.playerId===p.id)})});
router.get('/stats',(req,res)=>{const d=read();res.json(statsFor(d,Math.min(100,Number(req.query.limit)||10)))});
router.get('/stats/export.csv',(req,res)=>{
  const s=statsFor(read(),1000).players.sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name));
  const q=v=>`"${String(v).replace(/"/g,'""')}"`;
  res.type('text/csv').set('Content-Disposition','attachment; filename="league-stats.csv"');
  res.send(['player,team,apps,goals,assists,cleanSheets,tackles,saves',...s.map(r=>[q(r.name),q(r.teamName),r.apps,r.goals,r.assists,r.cleanSheets,r.tackles,r.saves].join(','))].join('\n'));
});

router.post('/players',auth,async(req,res)=>{
  const b=req.body||{};if(!clean(b.name))return res.status(400).json({error:'Player name required.'});
  let err,out;
  await mutate(d=>{
    if(d.players.some(p=>low(p.name)===low(b.name))){err='A player with that name already exists.';return}
    const teamId=clean(b.teamId);if(teamId){err=rosterError(d,teamId);if(err)return}
    out={id:nanoid(10),name:clean(b.name),discordId:clean(b.discordId),teamId,position:clean(b.position),number:clean(b.number),base:baseOf(b.base),active:true,createdAt:new Date().toISOString()};
    d.players.push(out);
  });
  if(err)return res.status(400).json({error:err});res.status(201).json(out);
});
router.patch('/players/:id',auth,async(req,res)=>{
  let err,out;const b=req.body||{};
  await mutate(d=>{
    const p=d.players.find(x=>x.id===req.params.id);if(!p){err='Player not found';return}
    if('teamId' in b){const tid=clean(b.teamId);if(tid&&tid!==p.teamId){err=rosterError(d,tid,p.id);if(err)return}p.teamId=tid}
    if('name' in b&&clean(b.name))p.name=clean(b.name);
    ['discordId','position','number'].forEach(k=>{if(k in b)p[k]=clean(b[k])});
    if('base' in b)p.base=baseOf(b.base);
    if('active' in b)p.active=!!b.active;
    out=p;
  });
  if(err)return res.status(err==='Player not found'?404:400).json({error:err});res.json(out);
});
router.delete('/players/:id',auth,async(req,res)=>{let f=false;await mutate(d=>{const n=d.players.length;d.players=d.players.filter(p=>p.id!==req.params.id);f=d.players.length!==n});if(!f)return res.status(404).json({error:'Player not found'});res.status(204).end()});

// Signing endpoints (used by the Discord bot): find-or-create the player, then put them on a team.
router.post('/players/sign',auth,async(req,res)=>{
  const b=req.body||{};let err,out;
  await mutate(d=>{
    const team=findTeam(d,b.team||b.teamId||b.roleId);if(!team){err='Team not found.';return}
    let p=findPlayer(d,b.discordId)||findPlayer(d,b.name||b.player);
    if(!p){if(!clean(b.name||b.player)){err='Player name required.';return}
      p={id:nanoid(10),name:clean(b.name||b.player),discordId:clean(b.discordId),teamId:'',position:clean(b.position),number:clean(b.number),base:baseOf({}),active:true,createdAt:new Date().toISOString()};d.players.push(p)}
    if(p.teamId!==team.id){err=rosterError(d,team.id,p.id);if(err)return}
    p.teamId=team.id;p.active=true;if(b.discordId&&!p.discordId)p.discordId=clean(b.discordId);out={player:p,team:team.name};
  });
  if(err)return res.status(400).json({error:err});res.json(out);
});
router.post('/players/release',auth,async(req,res)=>{
  let err,out;await mutate(d=>{const p=findPlayer(d,req.body?.player||req.body?.discordId);if(!p){err='Player not found.';return}p.teamId='';out=p});
  if(err)return res.status(404).json({error:err});res.json(out);
});

// Per-match stats: replaces the entries for one completed match.
router.put('/matches/:id/stats',auth,async(req,res)=>{
  let err,out;const entries=Array.isArray(req.body?.entries)?req.body.entries:[];
  await mutate(d=>{
    const m=d.matches.find(x=>x.id===req.params.id);if(!m){err='Match not found.';return}
    if(m.status!=='completed'){err='Publish the result first, then add match stats.';return}
    const ids=new Set(d.players.map(p=>p.id));
    m.stats=entries.filter(e=>ids.has(e.playerId)).map(e=>({playerId:e.playerId,...Object.fromEntries(KEYS.map(k=>[k,nn(e[k])]))})).filter(e=>KEYS.some(k=>e[k]>0));
    out=m;
  });
  if(err)return res.status(400).json({error:err});res.json(out);
});

// Quick add/subtract on a player's manual stats. Body: {player, stat, amount}
router.post('/stats/add',auth,async(req,res)=>{
  const {player,stat}=req.body||{};const amount=num(req.body?.amount??1);
  const key=KEYS.find(k=>low(k)===low(stat).replace(/[^a-z]/g,'')||low(k)===low(stat))||(low(stat)==='cs'?'cleanSheets':null);
  if(!key)return res.status(400).json({error:`stat must be one of: ${KEYS.join(', ')}`});
  let err,out;
  await mutate(d=>{const p=findPlayer(d,player);if(!p){err='Player not found.';return}p.base=baseOf(p.base);p.base[key]=Math.max(0,p.base[key]+amount);out={player:p.name,stat:key,manual:p.base[key]}});
  if(err)return res.status(404).json({error:err});res.json(out);
});

// CSV import. Header columns: player, team, goals, assists, cleanSheets, tackles, saves (+ optional position, number, discordId)
// mode "set" = these are season TOTALS; mode "add" = add these numbers on top.
router.post('/stats/import',auth,async(req,res)=>{
  const csv=String(req.body?.csv||'');const mode=req.body?.mode==='add'?'add':'set';const create=req.body?.createMissing!==false;
  const rows=parseCSV(csv);if(rows.length<2)return res.status(400).json({error:'Need a header row and at least one data row.'});
  const cols=rows[0].map(h=>ALIAS[low(h).replace(/[^a-z]/g,'')]||null);
  if(!cols.includes('name'))return res.status(400).json({error:'Header must include a "player" (or "name") column.'});
  const report={updated:0,created:0,errors:[]};
  await mutate(d=>{
    const mt=matchTotals(d);
    rows.slice(1).forEach((r,i)=>{
      const o={};cols.forEach((c,j)=>{if(c)o[c]=clean(r[j])});
      if(!o.name){return}
      let p=findPlayer(d,o.discordId)||findPlayer(d,o.name);
      const team=o.team?findTeam(d,o.team):null;
      if(o.team&&!team)report.errors.push(`Row ${i+2}: team "${o.team}" not found (player "${o.name}")`);
      if(!p){
        if(!create){report.errors.push(`Row ${i+2}: player "${o.name}" not found`);return}
        p={id:nanoid(10),name:o.name,discordId:o.discordId||'',teamId:'',position:'',number:'',base:baseOf({}),active:true,createdAt:new Date().toISOString()};d.players.push(p);mt[p.id]={...baseOf({}),apps:0};report.created++;
      }else report.updated++;
      if(team&&p.teamId!==team.id){const e=rosterError(d,team.id,p.id);if(e)report.errors.push(`Row ${i+2}: ${e}`);else p.teamId=team.id}
      if(o.position)p.position=o.position;if(o.number)p.number=o.number;if(o.discordId&&!p.discordId)p.discordId=o.discordId;
      p.base=baseOf(p.base);
      KEYS.forEach(k=>{if(o[k]===undefined||o[k]==='')return;const v=num(o[k]);p.base[k]=Math.max(0,mode==='add'?p.base[k]+v:v-(mt[p.id]?.[k]||0))});
    });
  });
  res.json(report);
});

// Owner only: wipe the season and seed the 8 franchises.
router.post('/admin/reset-season',owner,async(req,res)=>{
  if(req.body?.confirm!=='RESET')return res.status(400).json({error:'Send {"confirm":"RESET"} to confirm.'});
  await mutate(d=>resetSeason(d,{keepNews:!!req.body.keepNews}));res.json({ok:true});
});
module.exports=router;

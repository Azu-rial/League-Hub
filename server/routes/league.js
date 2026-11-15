// Players, stats, signings, CSV import and season reset.
const express=require('express');
const {nanoid}=require('nanoid');
const {read,mutate}=require('../lib/db');
const {auth,owner}=require('../lib/auth');
const {KEYS,num,matchTotals,statsFor}=require('../lib/stats');
const {resetSeason}=require('../lib/seed');
const router=require('../lib/asyncRouter')();
const clean=s=>String(s??'').trim();
const low=s=>clean(s).toLowerCase();
const nn=v=>Math.max(0,num(v));
const baseOf=b=>Object.fromEntries(KEYS.map(k=>[k,nn(b?.[k])]));
const ALIAS={player:'name',name:'name',team:'team',club:'team',goals:'goals',g:'goals',assists:'assists',a:'assists',ast:'assists',cleansheets:'cleanSheets',cleansheet:'cleanSheets',cs:'cleanSheets',tackles:'tackles',tkl:'tackles',saves:'saves',sv:'saves',position:'position',pos:'position',number:'number',no:'number',discordid:'discordId',discord:'discordId'};


// ---- Roblox link: read the username out of the Discord nickname, e.g. "Omar (Roblox_Omar)" or "Omar (@Roblox_Omar)".
// No brackets, or a bracket that isn't a Roblox-style name -> no Roblox link (skipped).
function splitName(raw){
  const s=clean(raw);
  const m=s.match(/\(\s*@?([A-Za-z0-9_]{3,20})\s*\)/);
  if(!m||/^[A-Z]{2,4}\d?$/.test(m[1]))return {display:s,roblox:''};   // "(CAM)", "(RMA)" are positions/tags, not usernames
  return {display:clean(s.replace(m[0],' ').replace(/\s+/g,' '))||m[1],roblox:m[1]};
}
const cleanRbx=v=>{const s=clean(v).replace(/^@/,'');return /^[A-Za-z0-9_]{3,20}$/.test(s)?s:''};
const slugify=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

// Roblox avatar lookup (server side, cached). Roblox blocks browsers from calling its API directly, so the site asks us.
const RBX={ids:new Map()};
async function rbxJson(url,opt){const r=await fetch(url,opt);if(!r.ok)throw new Error('Roblox '+r.status);return r.json()}
async function robloxIdFor(name){
  const k=low(name),hit=RBX.ids.get(k);if(hit&&Date.now()-hit.t<864e5)return hit.id;
  const j=await rbxJson('https://users.roblox.com/v1/usernames/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usernames:[name],excludeBannedUsers:false})});
  const id=j.data&&j.data[0]?j.data[0].id:null;RBX.ids.set(k,{id,t:Date.now()});return id;
}
const THUMB={headshot:['avatar-headshot','150x150'],bust:['avatar-bust','352x352'],full:['avatar','420x420']};
async function robloxThumb(id,type){
  const [path,size]=THUMB[type]||THUMB.headshot;
  const j=await rbxJson(`https://thumbnails.roblox.com/v1/users/${path}?userIds=${id}&size=${size}&format=Png&isCircular=false`);
  const x=j.data&&j.data[0];return x&&x.state==='Completed'?x.imageUrl:null;
}

// ---- Auto news when someone is signed / transferred (set AUTO_NEWS=off in the environment to disable)
const AUTO_NEWS=!/^(off|0|false|no)$/i.test(process.env.AUTO_NEWS||'');
const SIGN_TPL=[
  {t:'HERE WE GO: {P} joins {T}',x:'Done deal. {P} is now a {T} player.',b:'Here we go! {P} has signed for {T}.\n\nThe agreement is done, the role has been handed over and the move is official. {O}Welcome to the club.\n\nSquad count at {T}: {N}/{M}.'},
  {t:'OFFICIAL: {T} announce the signing of {P}',x:'{P} completes the move to {T}.',b:'{T} have officially announced the signing of {P}.\n\nThe deal is complete and the player is available straight away. {O}\n\nSquad count at {T}: {N}/{M}.'},
  {t:'DONE DEAL: {P} completes move to {T}',x:'Contracts signed. {T} have their man.',b:'It\'s done. {P} has completed a move to {T}.\n\nEverything is agreed and confirmed. {O}\n\nSquad count at {T}: {N}/{M}.'}
];
const MOVE_TPL=[
  {t:'HERE WE GO: {P} leaves {F} for {T}',x:'Transfer confirmed. {P} swaps {F} for {T}.',b:'Here we go! {P} is leaving {F} and joining {T}.\n\nThe transfer is confirmed and the role has been updated. {O}\n\nSquad count at {T}: {N}/{M}.'},
  {t:'TRANSFER ALERT: {P} moves from {F} to {T}',x:'{T} land {P} from {F}.',b:'{T} have completed the signing of {P} from {F}.\n\nThe player has changed clubs and is now registered with {T}. {O}\n\nSquad count at {T}: {N}/{M}.'}
];
function addSigningNews(d,p,team,from){
  if(!AUTO_NEWS)return;
  const key=`${p.id}:${team.id}`;
  if(d.news.some(n=>n.autoKey===key&&Date.now()-new Date(n.publishedAt)<6*36e5))return;   // no duplicate within 6h
  const tpl=(from?MOVE_TPL:SIGN_TPL),pick=tpl[d.news.length%tpl.length];
  const n=d.players.filter(x=>x.active!==false&&x.teamId===team.id).length;
  const fill=s=>s.replace(/\{P\}/g,p.name).replace(/\{T\}/g,team.name).replace(/\{F\}/g,from?from.name:'').replace(/\{N\}/g,n).replace(/\{M\}/g,team.rosterMax||20).replace(/\{O\} ?/g,team.owner?`Franchise owner ${team.owner} confirms. `:'');
  const title=fill(pick.t);
  d.news.push({id:nanoid(10),slug:slugify(title)+'-'+nanoid(5),title,excerpt:fill(pick.x),body:fill(pick.b).trim(),imageUrl:p.robloxName?`/api/players/${p.id}/avatar?type=bust`:'',category:'Transfers',published:true,publishedAt:new Date().toISOString(),author:'League Desk',autoKey:key});
}

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

router.get('/players',async(req,res)=>{const d=(await read());res.json(d.players.filter(p=>p.active!==false))});
router.get('/players/:id',async(req,res)=>{
  const d=(await read());const p=findPlayer(d,req.params.id);if(!p)return res.status(404).json({error:'Player not found'});
  const appearances=d.matches.filter(m=>m.status==='completed').map(m=>({m,e:(m.stats||[]).find(x=>x.playerId===p.id)})).filter(x=>x.e)
    .sort((a,b)=>new Date(b.m.scheduledAt)-new Date(a.m.scheduledAt))
    .map(({m,e})=>({id:m.id,scheduledAt:m.scheduledAt,homeTeamId:m.homeTeamId,awayTeamId:m.awayTeamId,homeScore:m.homeScore,awayScore:m.awayScore,stat:e}));
  res.json({player:p,stats:statsFor(d,1000).players.find(r=>r.playerId===p.id),appearances});
});
// Roblox avatar image for a player (redirects to Roblox's image). 404 = no Roblox username saved / not found, so the site shows initials.
router.get('/players/:id/avatar',async(req,res)=>{
  const d=(await read());const p=findPlayer(d,req.params.id);
  if(!p||!p.robloxName)return res.status(404).end();
  try{
    const uid=await robloxIdFor(p.robloxName);if(!uid)return res.status(404).end();
    const url=await robloxThumb(uid,req.query.type);if(!url)return res.status(404).end();
    res.set('Cache-Control','public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400');
    res.redirect(302,url);
  }catch(e){res.status(502).end()}
});
router.get('/stats',async(req,res)=>{const d=(await read());res.json(statsFor(d,Math.min(100,Number(req.query.limit)||10)))});
router.get('/stats/export.csv',async(req,res)=>{
  const s=statsFor((await read()),1000).players.sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name));
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
    out={id:nanoid(10),name:clean(b.name),discordId:clean(b.discordId),robloxName:cleanRbx(b.robloxName),teamId,position:clean(b.position),number:clean(b.number),base:baseOf(b.base),active:true,createdAt:new Date().toISOString()};
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
    if('robloxName' in b)p.robloxName=cleanRbx(b.robloxName);
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
    const {display,roblox}=splitName(b.name||b.player);
    let p=findPlayer(d,b.discordId)||findPlayer(d,display)||(roblox?findPlayer(d,roblox):null);
    if(!p){if(!display){err='Player name required.';return}
      p={id:nanoid(10),name:display,discordId:clean(b.discordId),robloxName:roblox,teamId:'',position:clean(b.position),number:clean(b.number),base:baseOf({}),active:true,createdAt:new Date().toISOString()};d.players.push(p)}
    const changed=p.teamId!==team.id,from=changed&&p.teamId?d.teams.find(t=>t.id===p.teamId):null;
    if(changed){err=rosterError(d,team.id,p.id);if(err)return}
    p.teamId=team.id;p.active=true;if(b.discordId&&!p.discordId)p.discordId=clean(b.discordId);
    if(roblox&&p.robloxName!==roblox)p.robloxName=roblox;
    if(changed)addSigningNews(d,p,team,from);
    out={player:p,team:team.name};
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

// ---- Discord roster sync (the bot's /sync). A team's Discord role is the source of truth for its roster.
// entries: [{teamId, roleId, members:[{discordId,name}]}]. Mutates d and returns a report.
function syncRoster(d,entries,skipReleases){
  const rep={linked:[],created:[],moved:[],released:[],unchanged:0,errors:[]};
  const synced=new Set(),claimed=new Map(),wanted=[];
  entries.forEach(e=>{
    const t=d.teams.find(x=>x.id===e.teamId&&x.active!==false);
    if(!t){rep.errors.push(`Unknown team id ${e.teamId}`);return}
    synced.add(t.id);
    if(clean(e.roleId))t.roleId=clean(e.roleId);
    (e.members||[]).forEach(m=>{
      const id=clean(m.discordId),name=clean(m.name)||id;if(!id)return;
      if(claimed.has(id)){rep.errors.push(`${name} holds roles for more than one team; kept on ${claimed.get(id).name}`);return}
      claimed.set(id,t);wanted.push({t,id,name});
    });
  });
  // 1) release linked players who no longer hold their team's role (frees roster spots first)
  if(!skipReleases)d.players.forEach(p=>{
    if(p.active===false||!p.discordId||!p.teamId||!synced.has(p.teamId)||claimed.has(p.discordId))return;
    const t=d.teams.find(x=>x.id===p.teamId);p.teamId='';rep.released.push(`${p.name} (${t?.name||'?'})`);
  });
  // 2) add / move / link everyone who holds a team role
  wanted.forEach(({t,id,name:rawName})=>{
    const {display:name,roblox}=splitName(rawName);
    let p=d.players.find(x=>x.discordId===id)||d.players.find(x=>!x.discordId&&(low(x.name)===low(name)||(roblox&&(low(x.name)===low(roblox)||low(x.robloxName)===low(roblox)))));
    if(p&&roblox&&p.robloxName!==roblox)p.robloxName=roblox;
    if(p&&p.teamId===t.id&&p.active!==false){
      if(!p.discordId){p.discordId=id;rep.linked.push(p.name)}else rep.unchanged++;
      return;
    }
    const full=rosterError(d,t.id,p?.id);if(full){rep.errors.push(`${name}: ${full}`);return}
    if(!p){
      if(d.players.some(x=>low(x.name)===low(name))){rep.errors.push(`${name}: a different player with that name already exists`);return}
      p={id:nanoid(10),name,discordId:id,robloxName:roblox,teamId:'',position:'',number:'',base:baseOf({}),active:true,createdAt:new Date().toISOString()};
      d.players.push(p);rep.created.push(`${p.name} → ${t.name}`);
    }else{
      if(!p.discordId){p.discordId=id;rep.linked.push(p.name)}
      rep.moved.push(`${p.name} → ${t.name}`);
    }
    p.teamId=t.id;p.active=true;
  });
  return rep;
}
// Body: {dryRun, teams:[{teamId, roleId, members:[{discordId,name}]}]}
router.post('/sync/roster',auth,async(req,res)=>{
  const entries=Array.isArray(req.body?.teams)?req.body.teams:[];
  if(!entries.length)return res.status(400).json({error:'No teams to sync.'});
  const total=entries.reduce((n,e)=>n+(Array.isArray(e.members)?e.members.length:0),0);
  try{
    let rep;
    if(req.body.dryRun)rep=syncRoster((await read()),entries,total===0);
    else await mutate(d=>{rep=syncRoster(d,entries,total===0)});
    res.json({dryRun:!!req.body.dryRun,...rep});
  }catch(e){res.status(500).json({error:`Sync failed: ${e.message}`})}
});

// Owner only: wipe the season and seed the 8 franchises.
router.post('/admin/reset-season',owner,async(req,res)=>{
  if(req.body?.confirm!=='RESET')return res.status(400).json({error:'Send {"confirm":"RESET"} to confirm.'});
  await mutate(d=>resetSeason(d,{keepNews:!!req.body.keepNews}));res.json({ok:true});
});
module.exports=router;

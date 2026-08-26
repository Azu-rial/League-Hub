const express=require('express');
const bcrypt=require('bcryptjs');
const {nanoid}=require('nanoid');
const {read,mutate}=require('../lib/db');
const {computeStandings}=require('../lib/standings');
const {auth,owner,sign}=require('../lib/auth');
const router=express.Router();
const clean=s=>String(s||'').trim();
const slug=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
function publicAdmin(a){return {id:a.id,username:a.username,displayName:a.displayName,role:a.role,createdAt:a.createdAt};}

router.get('/site',(req,res)=>{const d=read();res.json({settings:d.settings});});
router.get('/dashboard',(req,res)=>{const d=read();res.json({settings:d.settings,teams:d.teams,matches:d.matches,news:d.news,standings:computeStandings(d.teams,d.matches,d.settings)});});
router.get('/standings',(req,res)=>{const d=read();res.json(computeStandings(d.teams,d.matches,d.settings));});
router.get('/teams',(req,res)=>{res.json(read().teams.filter(t=>t.active!==false));});
router.get('/teams/:id',(req,res)=>{const d=read();const t=d.teams.find(x=>x.id===req.params.id||x.slug===req.params.id);if(!t)return res.status(404).json({error:'Team not found'});const s=computeStandings(d.teams,d.matches,d.settings).find(x=>x.teamId===t.id);const matches=d.matches.filter(m=>m.homeTeamId===t.id||m.awayTeamId===t.id).sort((a,b)=>new Date(b.scheduledAt)-new Date(a.scheduledAt));res.json({team:t,standing:s,matches});});
router.get('/matches',(req,res)=>{const d=read();const list=d.matches.map(m=>({...m,homeTeam:d.teams.find(t=>t.id===m.homeTeamId),awayTeam:d.teams.find(t=>t.id===m.awayTeamId)})).sort((a,b)=>new Date(a.scheduledAt||0)-new Date(b.scheduledAt||0));res.json(list);});
router.get('/news',(req,res)=>{res.json(read().news.filter(n=>n.published!==false).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt)));});

router.post('/auth/login',async(req,res)=>{const {username,password}=req.body||{};if(!username||!password)return res.status(400).json({error:'Username and password are required.'});const a=read().admins.find(x=>x.username.toLowerCase()===String(username).toLowerCase());if(!a||!(await bcrypt.compare(password,a.passwordHash)))return res.status(401).json({error:'Invalid username or password.'});res.json({token:sign(a),admin:publicAdmin(a)});});
router.post('/auth/bootstrap',async(req,res)=>{const d=read();if(d.admins.length)return res.status(403).json({error:'Setup already completed.'});const username=clean(req.body?.username)||process.env.BOOTSTRAP_OWNER_USERNAME;const password=req.body?.password||process.env.BOOTSTRAP_OWNER_PASSWORD;const displayName=clean(req.body?.displayName)||username;if(!username||!password||password.length<8)return res.status(400).json({error:'Username and password (8+ chars) are required.'});const a={id:nanoid(10),username,displayName,passwordHash:await bcrypt.hash(password,10),role:'owner',createdAt:new Date().toISOString()};await mutate(x=>x.admins.push(a));res.status(201).json({token:sign(a),admin:publicAdmin(a)});});
router.get('/auth/me',auth,(req,res)=>res.json({actor:req.actor}));

router.get('/admins',owner,(req,res)=>res.json(read().admins.map(publicAdmin)));
router.post('/admins',owner,async(req,res)=>{const {username,password,displayName,role}=req.body||{};if(!username||!password||password.length<8)return res.status(400).json({error:'Username and 8+ character password required.'});const d=read();if(d.admins.some(a=>a.username.toLowerCase()===String(username).toLowerCase()))return res.status(409).json({error:'Username already exists.'});const a={id:nanoid(10),username,displayName:displayName||username,passwordHash:await bcrypt.hash(password,10),role:role==='owner'?'owner':'admin',createdAt:new Date().toISOString()};await mutate(x=>x.admins.push(a));res.status(201).json(publicAdmin(a));});
router.delete('/admins/:id',owner,async(req,res)=>{if(req.actor.type==='admin'&&req.actor.id===req.params.id)return res.status(400).json({error:'You cannot delete yourself.'});await mutate(d=>{d.admins=d.admins.filter(a=>a.id!==req.params.id)});res.status(204).end();});

router.post('/teams',auth,async(req,res)=>{const {name,shortName,tag,logoUrl,color,description}=req.body||{};if(!clean(name))return res.status(400).json({error:'Team name required.'});const t={id:nanoid(10),name:clean(name),shortName:clean(shortName)||clean(name),tag:clean(tag).slice(0,6).toUpperCase(),logoUrl:clean(logoUrl),color:clean(color)||'#8b5cf6',description:clean(description),slug:slug(name),active:true,createdAt:new Date().toISOString()};await mutate(d=>d.teams.push(t));res.status(201).json(t);});
router.patch('/teams/:id',auth,async(req,res)=>{let out;await mutate(d=>{const t=d.teams.find(x=>x.id===req.params.id);if(!t)return;Object.assign(t,req.body);out=t;});if(!out)return res.status(404).json({error:'Team not found'});res.json(out);});
router.delete('/teams/:id',auth,async(req,res)=>{let found=false;await mutate(d=>{const t=d.teams.find(x=>x.id===req.params.id);if(t){t.active=false;found=true;}});if(!found)return res.status(404).json({error:'Team not found'});res.status(204).end();});

router.post('/matches',auth,async(req,res)=>{const {homeTeamId,awayTeamId,scheduledAt,venue,round,notes}=req.body||{};if(!homeTeamId||!awayTeamId||homeTeamId===awayTeamId)return res.status(400).json({error:'Choose two different teams.'});const d=read();if(!d.teams.find(t=>t.id===homeTeamId)||!d.teams.find(t=>t.id===awayTeamId))return res.status(400).json({error:'Invalid team.'});const m={id:nanoid(10),homeTeamId,awayTeamId,scheduledAt:scheduledAt||new Date().toISOString(),venue:clean(venue),round:clean(round),notes:clean(notes),status:'scheduled',homeScore:null,awayScore:null,createdAt:new Date().toISOString()};await mutate(x=>x.matches.push(m));res.status(201).json(m);});
router.patch('/matches/:id',auth,async(req,res)=>{let out;await mutate(d=>{const m=d.matches.find(x=>x.id===req.params.id);if(!m)return;Object.assign(m,req.body);if(req.body.status==='completed'){m.homeScore=Number(req.body.homeScore);m.awayScore=Number(req.body.awayScore);m.resultPublishedAt=new Date().toISOString();}out=m;});if(!out)return res.status(404).json({error:'Match not found'});res.json(out);});
router.post('/matches/:id/result',auth,async(req,res)=>{let out;await mutate(d=>{const m=d.matches.find(x=>x.id===req.params.id);if(!m)return;const hs=Number(req.body.homeScore),as=Number(req.body.awayScore);if(!Number.isFinite(hs)||!Number.isFinite(as)||hs<0||as<0)return;Object.assign(m,{homeScore:hs,awayScore:as,status:'completed',resultPublishedAt:new Date().toISOString()});out=m;});if(!out)return res.status(400).json({error:'Invalid match or score.'});res.json(out);});
router.delete('/matches/:id',auth,async(req,res)=>{let found=false;await mutate(d=>{const n=d.matches.length;d.matches=d.matches.filter(m=>m.id!==req.params.id);found=d.matches.length!==n;});if(!found)return res.status(404).json({error:'Match not found'});res.status(204).end();});

router.post('/news',auth,async(req,res)=>{const {title,excerpt,body,imageUrl,category,published}=req.body||{};if(!clean(title)||!clean(body))return res.status(400).json({error:'Title and body required.'});const n={id:nanoid(10),slug:slug(title)+'-'+nanoid(5),title:clean(title),excerpt:clean(excerpt),body:clean(body),imageUrl:clean(imageUrl),category:clean(category)||'League News',published:published!==false,publishedAt:new Date().toISOString(),author:req.actor.username};await mutate(d=>d.news.push(n));res.status(201).json(n);});
router.patch('/news/:id',auth,async(req,res)=>{let out;await mutate(d=>{const n=d.news.find(x=>x.id===req.params.id);if(!n)return;Object.assign(n,req.body);out=n;});if(!out)return res.status(404).json({error:'News item not found'});res.json(out);});
router.delete('/news/:id',auth,async(req,res)=>{await mutate(d=>{d.news=d.news.filter(n=>n.id!==req.params.id)});res.status(204).end();});

router.patch('/settings',owner,async(req,res)=>{await mutate(d=>Object.assign(d.settings,req.body||{}));res.json(read().settings);});
module.exports=router;

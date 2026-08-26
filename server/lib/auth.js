const jwt=require('jsonwebtoken');
const {read}=require('./db');
const secret=process.env.JWT_SECRET||'dev-secret';
const botKey=process.env.BOT_API_KEY||'';
function identify(req,res,next){
  if(botKey && req.get('x-api-key')===botKey){req.actor={type:'bot',id:'discord-bot',username:'Discord Bot',role:'owner'};return next();}
  const h=req.get('authorization')||''; const token=h.startsWith('Bearer ')?h.slice(7):'';
  if(token) try {const p=jwt.verify(token,secret); const a=read().admins.find(x=>x.id===p.id); if(a){req.actor={type:'admin',id:a.id,username:a.username,role:a.role};return next();}} catch{}
  req.actor=null; next();
}
function auth(req,res,next){if(!req.actor)return res.status(401).json({error:'Authentication required.'});next();}
function owner(req,res,next){if(!req.actor)return res.status(401).json({error:'Authentication required.'});if(req.actor.role!=='owner')return res.status(403).json({error:'Owner access required.'});next();}
function sign(admin){return jwt.sign({id:admin.id},secret,{expiresIn:'7d'});}
module.exports={identify,auth,owner,sign};

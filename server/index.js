require('dotenv').config();
const express=require('express');
const cors=require('cors');
const path=require('path');
const {identify}=require('./lib/auth');
const {read,mutate}=require('./lib/db');
const api=require('./routes/api');
const app=express();
const port=Number(process.env.PORT||4000);
const origins=(process.env.CORS_ORIGIN||'').split(',').map(x=>x.trim()).filter(Boolean);
app.use(cors({origin:origins.length?origins:true}));
app.use(express.json({limit:'2mb'}));
app.use(identify);
app.use('/api',api);
app.use('/api',require('./routes/league'));
app.use(express.static(path.join(__dirname,'..','public')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));

(async()=>{
  const d=read();
  if(d.admins.length===0 && process.env.BOOTSTRAP_OWNER_USERNAME && process.env.BOOTSTRAP_OWNER_PASSWORD){
    const bcrypt=require('bcryptjs'),{nanoid}=require('nanoid');
    d.admins.push({id:nanoid(10),username:process.env.BOOTSTRAP_OWNER_USERNAME,displayName:process.env.BOOTSTRAP_OWNER_USERNAME,passwordHash:await bcrypt.hash(process.env.BOOTSTRAP_OWNER_PASSWORD,10),role:'owner',createdAt:new Date().toISOString()});
    await mutate(db=>{db.admins=d.admins});
    console.log(`Created bootstrap owner: ${process.env.BOOTSTRAP_OWNER_USERNAME}`);
  }
  app.listen(port,()=>console.log(`League Hub running at http://localhost:${port}`));
})();

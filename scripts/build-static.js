// Builds public/dashboard.json from server/lib/snapshot.json so the site works even if the API is unreachable.
// Run: node scripts/build-static.js
const fs=require('fs'),path=require('path');
const {computeStandings}=require('../server/lib/standings');
const {statsFor}=require('../server/lib/stats');
const {DEFAULT_LOGOS}=require('../server/lib/logos');
const snap=JSON.parse(fs.readFileSync(path.join(__dirname,'..','server','lib','snapshot.json'),'utf8'));
const d={admins:[],teams:[],players:[],matches:[],news:[],...snap,settings:{leagueName:'Champions League',seasonName:'Season 2',tagline:'',logoUrl:'',primaryColor:'#8b5cf6',accentColor:'#22d3ee',pointsWin:3,pointsDraw:1,pointsLoss:0,...(snap.settings||{})}};
d.teams=d.teams.map(t=>t.logoUrl?t:{...t,logoUrl:DEFAULT_LOGOS[t.name]||''});
const standings=computeStandings(d.teams,d.matches,d.settings);
const st=statsFor(d,1000);
const out={settings:d.settings,teams:d.teams,matches:d.matches,news:d.news,standings,players:d.players.filter(p=>p.active!==false),stats:statsFor(d,10),teamDetails:{}};
d.teams.forEach(t=>{
  const det={team:t,standing:standings.find(x=>x.teamId===t.id),matches:d.matches.filter(m=>m.homeTeamId===t.id||m.awayTeamId===t.id).sort((a,b)=>new Date(b.scheduledAt)-new Date(a.scheduledAt)),players:st.players.filter(p=>p.teamId===t.id),tops:st.teamTops[t.id]||{}};
  out.teamDetails[t.id]=det;if(t.slug)out.teamDetails[t.slug]=det;
});
fs.writeFileSync(path.join(__dirname,'..','public','dashboard.json'),JSON.stringify(out));
console.log('public/dashboard.json written:',d.teams.length,'teams,',d.matches.length,'matches,',d.news.length,'news');

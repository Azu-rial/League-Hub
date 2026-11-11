const {nanoid}=require('nanoid');
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
// Franchise list for Season 2. Edit freely, then run: node scripts/reset-season.js --yes
const FRANCHISES=[
  {name:'Borussia Dortmund',shortName:'Dortmund',tag:'BVB',owner:'HaytCat',color:'#fde100'},
  {name:'Real Madrid',shortName:'Real Madrid',tag:'RMA',owner:'iHxrveyST',color:'#febe10'},
  {name:'Barcelona',shortName:'Barcelona',tag:'FCB',owner:'wyrez',color:'#a50044'},
  {name:'Paris Saint-Germain',shortName:'PSG',tag:'PSG',owner:'velo',color:'#004170'},
  {name:'AC Milan',shortName:'AC Milan',tag:'ACM',owner:'yogi',color:'#fb090b'},
  {name:'Manchester United',shortName:'Man United',tag:'MUN',owner:'Neshee',color:'#da291c'},
  {name:'Chelsea',shortName:'Chelsea',tag:'CHE',owner:'awex',color:'#034694'},
  {name:'Inter Milan',shortName:'Inter',tag:'INT',owner:'ph4nt_0m',color:'#0068a8'}
];
function seedTeams(){
  return FRANCHISES.map(t=>({id:nanoid(10),...t,ownerDiscordId:'',roleId:'',rosterMax:20,logoUrl:'',description:'',slug:slug(t.name),active:true,createdAt:new Date().toISOString()}));
}
// Wipes teams, players, matches (and news unless keepNews). Admins and settings are kept.
function resetSeason(d,{keepNews=false}={}){
  d.teams=seedTeams(); d.players=[]; d.matches=[];
  if(!keepNews)d.news=[];
  d.settings.leagueName='Champions League'; d.settings.seasonName='Season 2';
}
module.exports={FRANCHISES,seedTeams,resetSeason};

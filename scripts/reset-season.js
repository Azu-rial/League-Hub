// Usage: node scripts/reset-season.js --yes [--keep-news]
require('dotenv').config();
const {mutate}=require('../server/lib/db');
const {resetSeason}=require('../server/lib/seed');
if(!process.argv.includes('--yes')){console.log('This deletes ALL teams, players, fixtures and results (and news unless --keep-news).\nRe-run with --yes to confirm.');process.exit(1);}
mutate(d=>resetSeason(d,{keepNews:process.argv.includes('--keep-news')})).then(()=>{console.log('Season reset. 8 franchises seeded.');process.exit(0)});

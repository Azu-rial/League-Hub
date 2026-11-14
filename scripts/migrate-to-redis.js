// One-time: copy storage/db.json into Upstash Redis.  Usage: node scripts/migrate-to-redis.js [--force]
// Needs UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL + KV_REST_API_TOKEN) in .env
require('dotenv').config();
const fs = require('fs'), path = require('path');
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (!url || !token) { console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN first.'); process.exit(1); }
const raw = fs.readFileSync(path.join(__dirname, '..', 'storage', 'db.json'), 'utf8');
JSON.parse(raw);
const cmd = ['SET', 'league:db', raw]; if (!process.argv.includes('--force')) cmd.push('NX');
fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(cmd) })
  .then(r => r.json()).then(j => {
    if (j.error) throw new Error(j.error);
    console.log(j.result === 'OK' ? 'Done: database copied to Redis.' : 'Redis already has data; nothing changed. Use --force to overwrite.');
  }).catch(e => { console.error('Failed:', e.message); process.exit(1); });

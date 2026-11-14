// Storage: Upstash Redis over its REST API (works on Vercel). With no Redis env vars it falls back to
// storage/db.json so local development still works. The whole database is one JSON document.
const fs = require('fs');
const path = require('path');
const { DEFAULT_LOGOS } = require('./logos');

const dir = path.join(__dirname, '..', '..', 'storage');
const file = path.join(dir, 'db.json');

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const remote = !!(REDIS_URL && REDIS_TOKEN);
const KEY = 'league:db', VER = 'league:ver';

const defaults = {
  admins: [], teams: [], players: [], matches: [], news: [],
  settings: {
    leagueName: 'Champions League', seasonName: 'Season 2',
    tagline: 'Fixtures. Results. Standings. One place.',
    logoUrl: '', primaryColor: '#8b5cf6', accentColor: '#22d3ee',
    pointsWin: 3, pointsDraw: 1, pointsLoss: 0
  }
};
const clone = v => JSON.parse(JSON.stringify(v));

function normalize(data) {
  const out = { ...clone(defaults), ...(data || {}), settings: { ...clone(defaults.settings), ...((data && data.settings) || {}) } };
  out.teams = out.teams.map(t => t.logoUrl ? t : { ...t, logoUrl: DEFAULT_LOGOS[t.name] || '' });
  return out;
}

async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  let j = {};
  try { j = await r.json(); } catch {}
  if (!r.ok || j.error) throw new Error(`Database error: ${j.error || r.status}`);
  return j.result;
}

function readLocalFile() {
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error('storage/db.json is corrupted'); }
}

// Returns { data, ver }. Throws on any problem (never silently returns empty data).
async function load() {
  if (!remote) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaults, null, 2));
    return { data: normalize(readLocalFile()), ver: 0 };
  }
  let [raw, ver] = await redis(['MGET', KEY, VER]);
  if (raw == null) {
    // first run: seed from the bundled storage/db.json if it exists, otherwise start empty
    let seed = null;
    try { seed = readLocalFile(); } catch {}
    await redis(['SET', KEY, JSON.stringify(normalize(seed)), 'NX']);
    [raw, ver] = await redis(['MGET', KEY, VER]);
  }
  return { data: normalize(JSON.parse(raw)), ver: Number(ver || 0) };
}

async function read() { return (await load()).data; }

// compare-and-set: only writes if nobody else saved since we loaded
const CAS = `local v=tonumber(redis.call('GET',KEYS[2]) or '0')
if v~=tonumber(ARGV[1]) then return 0 end
redis.call('SET',KEYS[1],ARGV[2]) redis.call('SET',KEYS[2],tostring(v+1)) return 1`;

async function attempt(fn) {
  for (let i = 0; i < 6; i++) {
    const { data, ver } = await load();
    const before = JSON.stringify(data);
    const result = await fn(data);
    const after = JSON.stringify(data);
    if (after === before) return result; // nothing changed, nothing to save
    if (!remote) {
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
      fs.renameSync(tmp, file);
      return result;
    }
    if (await redis(['EVAL', CAS, '2', KEY, VER, String(ver), after]) === 1) return result;
    // someone else saved first: reload and run fn again on the fresh data
  }
  throw new Error('Database is busy, please try again.');
}

// Writes are queued per server instance; one failure never blocks the next write.
let queue = Promise.resolve();
function mutate(fn) {
  const run = queue.then(() => attempt(fn));
  queue = run.catch(() => {});
  return run;
}

module.exports = { read, mutate, defaults, remote };

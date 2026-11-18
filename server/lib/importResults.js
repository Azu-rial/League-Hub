// Turns the match-result posts staff publish in Discord into matches + player stats.
// parseResults(text) is pure. applyImport(db, parsed, news) mutates the db object and returns a report.
const { nanoid } = require('nanoid');
const { seedTeams } = require('./seed');

const KEYS = ['goals', 'assists', 'cleanSheets', 'tackles', 'saves'];
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const low = s => String(s || '').trim().toLowerCase();
const STAT_RE = /(\d+)\s*(goals?|assists?|tackles?|saves?)\b/gi;
const STAT_FIRST = /\d+\s*(goals?|assists?|tackles?|saves?)\b/i;
const TS_RE = /[—–-]\s*(\d{1,2})\/(\d{1,2})\/(\d{2}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i;
const HEADER_RE = /\|\s*([^|]+?)\s+(\d+)\s*[–—-]\s*(\d+)\s+([^|]+?)\s*\|/;

function parseStamp(m) {
  let h = Number(m[4]) % 12;
  if (/pm/i.test(m[6])) h += 12;
  return new Date(Date.UTC(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]), h, Number(m[5]))).toISOString();
}

function parsePlayerLine(rest) {
  let s = rest.replace(/^@/, '');
  const first = s.search(STAT_FIRST);
  let head = first >= 0 ? s.slice(0, first) : s;
  const tail = first >= 0 ? s.slice(first) : '';
  head = head.replace(/[—–-]\s*$/, '').trim();
  const hm = head.match(/\(([^)]*)\)/);
  const roblox = hm ? hm[1].replace(/^@/, '').trim() : '';
  const name = head.replace(/\([^)]*\)/, '').replace(/\s+nil$/i, '').replace(/\s+/g, ' ').trim();
  const stats = { goals: 0, assists: 0, cleanSheets: 0, tackles: 0, saves: 0 };
  let m; STAT_RE.lastIndex = 0;
  while ((m = STAT_RE.exec(tail))) {
    const w = m[2].toLowerCase();
    const k = w.startsWith('g') ? 'goals' : w.startsWith('a') ? 'assists' : w.startsWith('t') ? 'tackles' : 'saves';
    stats[k] += Number(m[1]);
  }
  // A bare number in the third slot ("4 Goals | 2 Assists | 1") is tackles.
  const segs = tail.split('|').map(x => x.trim());
  let spare = tail.replace(STAT_RE, '');
  if (segs.length === 3 && /^\d+\s*goals?$/i.test(segs[0]) && /^\d+\s*assists?$/i.test(segs[1]) && /^\d+$/.test(segs[2])) {
    stats.tackles += Number(segs[2]);
    spare = '';
  }
  const leftover = spare.match(/\d+/);
  return { name, roblox, stats, unlabelled: leftover ? leftover[0] : null };
}

function parseResults(text, opts = {}) {
  const matches = [], warnings = [];
  let cur = null, stamp = opts.postedAt || null;
  const finish = () => { if (cur) matches.push(cur); cur = null; };
  String(text || '').split(/\r?\n/).forEach(raw => {
    const line = raw.replace(/^[>\s]+/, '').trim();
    if (!line) return;
    const ts = line.match(TS_RE);
    if (ts) { stamp = parseStamp(ts); return; }
    const h = line.match(HEADER_RE);
    if (h && /^:/.test(line)) {
      finish();
      cur = { home: h[1].trim(), away: h[4].trim(), homeScore: Number(h[2]), awayScore: Number(h[3]), round: '', referee: '', date: stamp, notes: [], mvps: [], stats: [] };
      return;
    }
    if (!cur) return;
    const rd = line.match(/game\s*week\s*(\d+)/i);
    if (rd && !cur.round) { cur.round = `Gameweek ${rd[1]}`; return; }
    const rf = line.match(/^:referee:\s*\|\s*@?(.+?)\s*(\(|$)/i);
    if (rf) { cur.referee = rf[1].trim(); return; }
    const mv = line.match(/^(🥇|🥈|🥉)\s*\|\s*(.+)$/u);
    if (mv) { cur.mvps.push(mv[2].replace(/:\w+:/g, '').replace(/\([^)]*\)/g, '').replace(/@/g, '').replace(/\s+/g, ' ').trim()); return; }
    const pl = line.match(/^:([A-Za-z_]+):\s*\|\s*(@.+)$/);
    if (pl) {
      const p = parsePlayerLine(pl[2]);
      if (!p.name) return;
      if (p.unlabelled) warnings.push(`${cur.home} v ${cur.away}: "${p.name}" has an unlabelled number (${p.unlabelled}) that was ignored`);
      cur.stats.push({ teamRef: pl[1], ...p });
      return;
    }
    if (/\bff\b|no stats/i.test(line) && !/^:\w+:\s*\|/.test(line)) cur.notes.push(line.replace(/:\w+:/g, '').replace(/\s+/g, ' ').trim());
  });
  finish();
  return { matches, warnings };
}

function parseNick(display) {
  const m = String(display || '').match(/^(.*?)\s*\(@?([^)]*)\)\s*$/);
  return m ? { name: m[1].trim(), roblox: m[2].trim() } : { name: String(display || '').trim(), roblox: '' };
}

function applyImport(d, parsed, news = [], opts = {}) {
  const ids = new Map();
  (opts.mentions || []).forEach(x => { if (x && x.id) ids.set(low(parseNick(x.displayName || x.name).name), String(x.id)); });
  const rep = { teamsSeeded: false, matchesCreated: 0, matchesUpdated: 0, playersCreated: 0, playersUpdated: 0, newsCreated: 0, skipped: [], warnings: [...(parsed.warnings || [])] };
  if (!d.teams.some(t => t.active !== false)) { d.teams = seedTeams(); rep.teamsSeeded = true; }
  const teamOf = ref => { const r = norm(ref); return r ? d.teams.find(t => t.active !== false && [t.name, t.shortName, t.tag, t.slug].some(x => norm(x) === r)) : null; };
  const ordered = parsed.matches.map((m, i) => ({ m, i })).sort((a, b) => (a.m.date || '').localeCompare(b.m.date || '') || a.i - b.i).map(x => x.m);

  ordered.forEach(pm => {
    const home = teamOf(pm.home), away = teamOf(pm.away);
    if (!home || !away) { rep.skipped.push(`${pm.home} ${pm.homeScore}-${pm.awayScore} ${pm.away}: team not found`); return; }
    const round = pm.round || 'Gameweek';
    const when = pm.date || new Date().toISOString();
    const notes = [pm.referee ? `Referee: ${pm.referee}` : '', ...pm.notes, pm.mvps.length ? `MVPs: ${pm.mvps.join(', ')}` : ''].filter(Boolean).join(' | ');
    let m = d.matches.find(x => x.homeTeamId === home.id && x.awayTeamId === away.id && x.round === round);
    if (m) rep.matchesUpdated++;
    else { m = { id: nanoid(10), homeTeamId: home.id, awayTeamId: away.id, venue: '', createdAt: when }; d.matches.push(m); rep.matchesCreated++; }
    Object.assign(m, { round, scheduledAt: when, notes, status: 'completed', homeScore: pm.homeScore, awayScore: pm.awayScore, resultPublishedAt: when });

    const byPlayer = new Map();
    pm.stats.forEach(s => {
      const team = teamOf(s.teamRef) || (norm(s.teamRef) === norm(pm.home) ? home : norm(s.teamRef) === norm(pm.away) ? away : null);
      if (!team) { rep.warnings.push(`${s.name}: could not tell which team ":${s.teamRef}:" is`); return; }
      const did = ids.get(low(s.name)) || '';
      let p = (did && d.players.find(x => x.discordId === did)) || d.players.find(x => low(x.name) === low(s.name));
      if (!p) {
        p = { id: nanoid(10), name: s.name, discordId: did, roblox: s.roblox, teamId: team.id, position: '', number: '', base: Object.fromEntries(KEYS.map(k => [k, 0])), active: true, createdAt: when };
        d.players.push(p); rep.playersCreated++;
      } else {
        if (s.roblox && !p.roblox) p.roblox = s.roblox;
        if (did && !p.discordId) p.discordId = did;
        if (did && p.discordId === did && low(p.name) !== low(s.name) && !d.players.some(x => x !== p && low(x.name) === low(s.name))) p.name = s.name;
        p.teamId = team.id; p.active = true; rep.playersUpdated++;
      }
      const e = byPlayer.get(p.id) || { playerId: p.id, goals: 0, assists: 0, cleanSheets: 0, tackles: 0, saves: 0 };
      KEYS.forEach(k => { e[k] += s.stats[k] || 0; });
      byPlayer.set(p.id, e);
    });
    m.stats = [...byPlayer.values()].filter(e => KEYS.some(k => e[k] > 0));
  });

  news.forEach(n => {
    if (!n || !n.title || !n.body) return;
    if (d.news.some(x => low(x.title) === low(n.title))) return;
    d.news.push({ id: nanoid(10), slug: norm(n.title).slice(0, 40) + '-' + nanoid(5), title: n.title, excerpt: n.excerpt || '', body: n.body, imageUrl: n.imageUrl || '', category: n.category || 'League News', published: true, publishedAt: n.publishedAt || new Date().toISOString(), author: 'League Staff' });
    rep.newsCreated++;
  });

  d.teams.forEach(t => {
    const n = d.players.filter(p => p.active !== false && p.teamId === t.id).length;
    if (n > Number(t.rosterMax || 20)) rep.warnings.push(`${t.name} has ${n} players (limit ${t.rosterMax || 20}); /sync will tidy rosters`);
  });
  return rep;
}

module.exports = { parseResults, applyImport, parseNick };

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', '..', 'storage');
const file = path.join(dir, 'db.json');

const defaults = {
  admins: [],
  teams: [],
  players: [],
  matches: [],
  news: [],
  settings: {
    leagueName: 'Champions League',
    seasonName: 'Season 2',
    tagline: 'Fixtures. Results. Standings. One place.',
    logoUrl: '',
    primaryColor: '#8b5cf6',
    accentColor: '#22d3ee',
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0
  }
};

function clone(v) { return JSON.parse(JSON.stringify(v)); }
function ensure() {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaults, null, 2));
}
function read() {
  ensure();
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { ...clone(defaults), ...data, settings: { ...clone(defaults.settings), ...(data.settings || {}) } };
  } catch {
    return clone(defaults);
  }
}
let queue = Promise.resolve();
function mutate(fn) {
  queue = queue.then(async () => {
    const data = read();
    const result = await fn(data);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
    return result;
  });
  return queue;
}
module.exports = { read, mutate, defaults };

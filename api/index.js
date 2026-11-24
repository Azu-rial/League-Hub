// Vercel serverless entry. Vercel rewrites change req.url to the destination
// (/api/index.js), so the real path is passed in the "__p" query param and restored here.
const app = require('../server/index.js');

module.exports = (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    const p = u.searchParams.get('__p');
    if (p !== null) {
      u.searchParams.delete('__p');
      const rest = u.searchParams.toString();
      req.url = '/api/' + decodeURIComponent(p).replace(/^\/+/, '') + (rest ? '?' + rest : '');
    }
  } catch (e) { /* leave req.url as is */ }
  return app(req, res);
};

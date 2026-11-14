// Express 4 doesn't catch errors from async handlers. This router forwards them to the error handler.
const express = require('express');
module.exports = function asyncRouter() {
  const router = express.Router();
  ['get', 'post', 'put', 'patch', 'delete'].forEach(m => {
    const orig = router[m].bind(router);
    router[m] = (p, ...handlers) => orig(p, ...handlers.map(h =>
      typeof h === 'function' ? (req, res, next) => Promise.resolve(h(req, res, next)).catch(next) : h));
  });
  return router;
};

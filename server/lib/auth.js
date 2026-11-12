
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { read } = require('./db');

let secret = process.env.JWT_SECRET;

if (!secret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production.');
  }

  secret = crypto.randomBytes(32).toString('hex');
}

const botKey = process.env.BOT_API_KEY || '';

function identify(req, res, next) {
  if (botKey && req.get('x-api-key') === botKey) {
    req.actor = {
      type: 'bot',
      id: 'discord-bot',
      username: 'Discord Bot',
      role: 'owner'
    };
    return next();
  }

  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : '';

  if (token) {
    try {
      const payload = jwt.verify(token, secret);

      let admin = null;

      try {
        admin = read().admins.find(a => a.id === payload.id) || null;
      } catch (error) {}

      if (admin) {
        req.actor = {
          type: 'admin',
          id: admin.id,
          username: admin.username,
          role: admin.role
        };
        return next();
      }

      // Fallback for serverless environments.
      // JWT signature verifies that these claims were issued by our server.
      if (
        payload.id &&
        payload.username &&
        ['admin', 'owner'].includes(payload.role)
      ) {
        req.actor = {
          type: 'admin',
          id: payload.id,
          username: payload.username,
          role: payload.role
        };
        return next();
      }

    } catch (error) {}
  }

  req.actor = null;
  next();
}

function auth(req, res, next) {
  if (!req.actor) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  next();
}

function owner(req, res, next) {
  if (!req.actor) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  if (req.actor.role !== 'owner') {
    return res.status(403).json({
      error: 'Owner access required.'
    });
  }

  next();
}

function sign(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: admin.role
    },
    secret,
    { expiresIn: '7d' }
  );
}

module.exports = {
  identify,
  auth,
  owner,
  sign
};

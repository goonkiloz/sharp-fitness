const jwt = require('jsonwebtoken');
const { jwtSecret, environment } = require('../config');
const { User } = require('../db/models');
const isProduction = environment === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 7
};

function safeUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isTrainer: Boolean(user.isTrainer)
  };
}
function setTokenCookie(res, user) {
  const token = jwt.sign({ data: { id: user.id } }, jwtSecret, { expiresIn: '7d' });
  res.cookie('token', token, cookieOptions);
}
async function restoreUser(req, _res, next) {
  const token = req.cookies.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = await User.findByPk(payload.data.id);
  } catch (_) { req.user = null; }
  next();
}
function requireAuth(req, _res, next) {
  if (!req.user) { const err = new Error('Authentication required.'); err.status = 401; return next(err); }
  next();
}
function requireTrainer(req, _res, next) {
  if (!req.user) { const err = new Error('Authentication required.'); err.status = 401; return next(err); }
  if (!req.user.isTrainer) { const err = new Error('Trainer access required.'); err.status = 403; return next(err); }
  next();
}
module.exports = { cookieOptions, safeUser, setTokenCookie, restoreUser, requireAuth, requireTrainer };

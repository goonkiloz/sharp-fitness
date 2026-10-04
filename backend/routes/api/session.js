const express = require('express');
const { User } = require('../../db/models');
const { safeUser, setTokenCookie, requireAuth, cookieOptions } = require('../../utils/auth');
const router = express.Router();
router.get('/', (req, res) => res.json({ user: req.user ? safeUser(req.user) : null }));
router.post('/', async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email: String(email || '').trim().toLowerCase() } });
  if (!user || !(await user.validatePassword(password || ''))) {
    const err = new Error('Invalid email or password.'); err.status = 401; return next(err);
  }
  setTokenCookie(res, user);
  res.json({ user: safeUser(user) });
});
router.delete('/', requireAuth, (req, res) => { res.clearCookie('token', cookieOptions); res.json({ message: 'Logged out' }); });
module.exports = router;

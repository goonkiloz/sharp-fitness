const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../../db/models');
const { safeUser, setTokenCookie } = require('../../utils/auth');
const router = express.Router();
router.post('/', async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password || password.length < 8) {
    const err = new Error('First name, last name, email, and a password of at least 8 characters are required.'); err.status = 400; return next(err);
  }
  const normalized = email.trim().toLowerCase();
  if (await User.findOne({ where: { email: normalized } })) {
    const err = new Error('An account with that email already exists.'); err.status = 409; return next(err);
  }
  const user = await User.create({ firstName: firstName.trim(), lastName: lastName.trim(), email: normalized, hashedPassword: await bcrypt.hash(password, 12) });
  setTokenCookie(res, user);
  res.status(201).json({ user: safeUser(user) });
});
module.exports = router;

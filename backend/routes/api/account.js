const express = require('express');
const { Purchase, Product, ClientFile } = require('../../db/models');
const { requireAuth, safeUser } = require('../../utils/auth');
const router = express.Router();
router.get('/', requireAuth, async (req, res) => {
  const purchases = await Purchase.findAll({
    where: { userId: req.user.id },
    include: [{ model: Product }],
    order: [['createdAt','DESC']]
  });
  const files = await ClientFile.findAll({ where: { userId: req.user.id }, order: [['createdAt','DESC']] });
  res.json({ user: safeUser(req.user), purchases, files });
});
module.exports = router;

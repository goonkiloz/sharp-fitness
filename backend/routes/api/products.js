const express = require('express');
const { Product, Purchase } = require('../../db/models');
const router = express.Router();
router.get('/', async (req, res) => {
  const products = await Product.findAll({ where: { active: true }, order: [['priceCents','ASC']] });
  let owned = new Set();
  if (req.user) {
    const purchases = await Purchase.findAll({ where: { userId: req.user.id, status: 'active' } });
    owned = new Set(purchases.map(p => p.productId));
  }
  res.json({ products: products.map(p => ({ ...p.toJSON(), owned: owned.has(p.id) })) });
});
module.exports = router;

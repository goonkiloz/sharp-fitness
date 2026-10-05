const express = require('express');
const { Purchase, Product, ClientFile } = require('../../db/models');
const { requireAuth, safeUser } = require('../../utils/auth');
const { syncStripeCustomerSubscriptions } = require('../../utils/stripe-sync');
const router = express.Router();

function collapsePurchases(purchases) {
  const byProduct = new Map();

  for (const purchase of purchases) {
    const productId = purchase.productId;
    const existing = byProduct.get(productId);

    if (!existing) {
      byProduct.set(productId, purchase);
      continue;
    }

    const purchaseIsActive = purchase.status === 'active';
    const existingIsActive = existing.status === 'active';

    if (purchaseIsActive && !existingIsActive) {
      byProduct.set(productId, purchase);
      continue;
    }

    if (purchaseIsActive === existingIsActive) {
      const purchaseTime = new Date(purchase.purchasedAt || purchase.createdAt || 0).getTime();
      const existingTime = new Date(existing.purchasedAt || existing.createdAt || 0).getTime();
      if (purchaseTime > existingTime) byProduct.set(productId, purchase);
    }
  }

  return Array.from(byProduct.values()).sort((a, b) =>
    new Date(b.purchasedAt || b.createdAt || 0) - new Date(a.purchasedAt || a.createdAt || 0)
  );
}

router.get('/', requireAuth, async (req, res) => {
  try {
    await syncStripeCustomerSubscriptions(req.user);
  } catch (err) {
    console.error('Stripe account reconciliation failed:', err);
  }

  const purchases = await Purchase.findAll({
    where: { userId: req.user.id },
    include: [{ model: Product }],
    order: [['createdAt', 'DESC']]
  });

  const files = await ClientFile.findAll({
    where: { userId: req.user.id },
    include: [{ model: Product }],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    user: safeUser(req.user),
    purchases: collapsePurchases(purchases),
    files
  });
});

module.exports = router;

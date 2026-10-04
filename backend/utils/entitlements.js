const { Op } = require('sequelize');
const { Purchase, Product } = require('../db/models');

function calculatedServiceEnd(purchase) {
  if (purchase.serviceEndsAt) return new Date(purchase.serviceEndsAt);
  const days = purchase.Product?.deliveryDurationDays;
  if (!days || !purchase.purchasedAt) return null;
  return new Date(new Date(purchase.purchasedAt).getTime() + Number(days) * 24 * 60 * 60 * 1000);
}

async function getContentDeliveryEntitlement(userId) {
  const purchases = await Purchase.findAll({
    where: { userId, status: 'active' },
    include: [{ model: Product }],
    order: [['purchasedAt', 'DESC']]
  });

  const now = new Date();
  for (const purchase of purchases) {
    if (!purchase.Product) continue;
    if (purchase.Product.billingType === 'monthly') {
      return { allowed: true, purchase, reason: 'active_monthly' };
    }
    if (purchase.Product.billingType === 'one_time') {
      const end = calculatedServiceEnd(purchase);
      if (!end || end >= now) {
        return { allowed: true, purchase, reason: 'one_time_delivery_window', serviceEndsAt: end };
      }
    }
  }
  return { allowed: false, purchase: null, reason: 'no_current_delivery_entitlement' };
}

module.exports = { getContentDeliveryEntitlement, calculatedServiceEnd };

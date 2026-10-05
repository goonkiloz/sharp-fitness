const { Purchase, Product } = require('../db/models');

function calculatedServiceEnd(purchase) {
  if (purchase.serviceEndsAt) return new Date(purchase.serviceEndsAt);
  const days = purchase.Product?.deliveryDurationDays;
  if (!days || !purchase.purchasedAt) return null;
  return new Date(new Date(purchase.purchasedAt).getTime() + Number(days) * 24 * 60 * 60 * 1000);
}

async function getContentDeliveryOptions(userId) {
  const purchases = await Purchase.findAll({
    where: { userId, status: 'active' },
    include: [{ model: Product }],
    order: [['purchasedAt', 'DESC'], ['createdAt', 'DESC']]
  });

  const now = new Date();
  const seen = new Set();
  const options = [];

  for (const purchase of purchases) {
    const product = purchase.Product;
    if (!product || seen.has(product.id)) continue;

    if (product.billingType === 'monthly') {
      seen.add(product.id);
      options.push({
        allowed: true,
        purchase,
        product,
        reason: 'active_monthly',
        serviceEndsAt: null
      });
      continue;
    }

    if (product.billingType === 'one_time') {
      const end = calculatedServiceEnd(purchase);
      if (!end || end >= now) {
        seen.add(product.id);
        options.push({
          allowed: true,
          purchase,
          product,
          reason: 'one_time_delivery_window',
          serviceEndsAt: end
        });
      }
    }
  }

  return options;
}

async function getContentDeliveryEntitlement(userId, productId = null) {
  const options = await getContentDeliveryOptions(userId);
  if (productId != null) {
    const match = options.find(option => Number(option.product.id) === Number(productId));
    return match || { allowed: false, purchase: null, product: null, reason: 'no_current_delivery_entitlement', serviceEndsAt: null };
  }
  return options[0] || { allowed: false, purchase: null, product: null, reason: 'no_current_delivery_entitlement', serviceEndsAt: null };
}

module.exports = { getContentDeliveryEntitlement, getContentDeliveryOptions, calculatedServiceEnd };

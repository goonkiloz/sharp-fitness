const Stripe = require('stripe');
const { Op } = require('sequelize');
const { User, Purchase, Product } = require('../db/models');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function subscriptionStatusToPurchaseStatus(status) {
  if (['active', 'trialing', 'past_due'].includes(status)) return 'active';
  if (status === 'incomplete') return 'pending';
  return 'canceled';
}

async function findUserForStripeCustomer(stripe, customerRef) {
  const customerId = typeof customerRef === 'string' ? customerRef : customerRef?.id;
  if (!customerId) return null;

  let user = await User.findOne({ where: { stripeCustomerId: customerId } });
  if (user) return user;

  let customer = typeof customerRef === 'object' && customerRef ? customerRef : null;
  if (!customer || !customer.email) {
    try {
      customer = await stripe.customers.retrieve(customerId);
    } catch (_err) {
      return null;
    }
  }

  if (!customer || customer.deleted || !customer.email) return null;

  user = await User.findOne({ where: { email: String(customer.email).toLowerCase() } });
  if (user && user.stripeCustomerId !== customerId) {
    await user.update({ stripeCustomerId: customerId });
  }
  return user;
}

async function resolveLocalProduct(stripe, item, subscription) {
  if (!item?.price) return null;

  let stripeProduct = item.price.product;
  if (typeof stripeProduct === 'string') {
    try {
      stripeProduct = await stripe.products.retrieve(stripeProduct);
    } catch (_err) {
      stripeProduct = null;
    }
  }

  const metadata = {
    ...(stripeProduct?.metadata || {}),
    ...(subscription?.metadata || {})
  };

  if (metadata.localProductId) {
    const product = await Product.findByPk(Number(metadata.localProductId));
    if (product) return product;
  }

  if (metadata.localProductSlug) {
    const product = await Product.findOne({ where: { slug: metadata.localProductSlug } });
    if (product) return product;
  }

  const products = await Product.findAll();
  const stripeName = normalizeName(stripeProduct?.name);
  const amount = item.price.unit_amount;
  const recurring = Boolean(item.price.recurring);

  const exact = products.find(product =>
    stripeName &&
    normalizeName(product.name) === stripeName &&
    (amount == null || Number(product.priceCents) === Number(amount)) &&
    ((product.billingType === 'monthly') === recurring)
  );
  if (exact) return exact;

  const amountMatch = products.filter(product =>
    amount != null &&
    Number(product.priceCents) === Number(amount) &&
    ((product.billingType === 'monthly') === recurring)
  );

  return amountMatch.length === 1 ? amountMatch[0] : null;
}

async function syncStripeSubscription(subscription, stripeInstance = null) {
  const stripe = stripeInstance || getStripe();
  if (!stripe || !subscription?.id) return null;

  const user = await findUserForStripeCustomer(stripe, subscription.customer);
  if (!user) return null;

  let fullSubscription = subscription;
  if (!fullSubscription.items?.data?.length) {
    fullSubscription = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['items.data.price.product']
    });
  }

  const item = fullSubscription.items?.data?.[0];
  if (!item) return null;

  const product = await resolveLocalProduct(stripe, item, fullSubscription);
  if (!product) {
    console.warn(`Could not map Stripe subscription ${fullSubscription.id} to a local product.`);
    return null;
  }

  const status = subscriptionStatusToPurchaseStatus(fullSubscription.status);
  const started = Number(fullSubscription.start_date || fullSubscription.created || 0);
  const purchasedAt = started ? new Date(started * 1000) : new Date();

  const values = {
    userId: user.id,
    productId: product.id,
    stripeSubscriptionId: fullSubscription.id,
    amountCents: Number(item.price.unit_amount ?? product.priceCents),
    status,
    purchasedAt,
    serviceEndsAt: null
  };

  let purchase = await Purchase.findOne({
    where: { stripeSubscriptionId: fullSubscription.id, productId: product.id }
  });

  if (!purchase) {
    purchase = await Purchase.findOne({
      where: {
        userId: user.id,
        productId: product.id,
        status: 'pending',
        stripeSubscriptionId: null,
        createdAt: { [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  if (purchase) {
    await purchase.update(values);
    return purchase;
  }

  return Purchase.create(values);
}

async function syncStripeCustomerSubscriptions(user, stripeInstance = null) {
  const stripe = stripeInstance || getStripe();
  if (!stripe || !user?.stripeCustomerId) return [];

  const synced = [];
  let startingAfter;

  do {
    const page = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
      expand: ['data.items.data.price.product']
    });

    for (const subscription of page.data) {
      const purchase = await syncStripeSubscription(subscription, stripe);
      if (purchase) synced.push(purchase);
    }

    startingAfter = page.has_more && page.data.length
      ? page.data[page.data.length - 1].id
      : null;
  } while (startingAfter);

  return synced;
}

module.exports = {
  getStripe,
  syncStripeSubscription,
  syncStripeCustomerSubscriptions
};

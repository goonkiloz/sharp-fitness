const express = require('express');
const Stripe = require('stripe');
const { Product, Purchase } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
function appUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (process.env.RENDER_EXTERNAL_HOSTNAME) return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  return `${req.protocol}://${req.get('host')}`.replace(':8000', ':3000');
}
router.post('/:productId', requireAuth, async (req, res, next) => {
  const stripe = getStripe();
  if (!stripe) { const err = new Error('Stripe is not configured yet.'); err.status = 503; return next(err); }
  const product = await Product.findByPk(req.params.productId);
  if (!product || !product.active) { const err = new Error('Product not found.'); err.status = 404; return next(err); }

  if (product.billingType === 'one_time') {
    const existing = await Purchase.findOne({ where: { userId: req.user.id, productId: product.id, status: 'active' } });
    if (existing) return res.json({ alreadyOwned: true });
  }

  let customer = req.user.stripeCustomerId;
  if (!customer) {
    const created = await stripe.customers.create({ email: req.user.email, name: `${req.user.firstName} ${req.user.lastName}`, metadata: { userId: String(req.user.id) } });
    customer = created.id;
    await req.user.update({ stripeCustomerId: customer });
  }

  const lineItem = {
    price_data: {
      currency: 'usd',
      unit_amount: product.priceCents,
      product_data: { name: product.name, description: product.description }
    },
    quantity: 1
  };
  if (product.billingType === 'monthly') lineItem.price_data.recurring = { interval: 'month' };

  const base = appUrl(req);
  const session = await stripe.checkout.sessions.create({
    customer,
    mode: product.billingType === 'monthly' ? 'subscription' : 'payment',
    line_items: [lineItem],
    success_url: `${base}/account?checkout=success`,
    cancel_url: `${base}/programs?checkout=canceled`,
    metadata: { userId: String(req.user.id), productId: String(product.id) }
  });
  await Purchase.create({ userId: req.user.id, productId: product.id, stripeCheckoutSessionId: session.id, amountCents: product.priceCents, status: 'pending' });
  res.json({ url: session.url });
});
module.exports = router;

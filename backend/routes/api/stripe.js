const express = require('express');
const Stripe = require('stripe');
const { Purchase, Product } = require('../../db/models');
const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Stripe webhook is not configured.');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); }
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    const purchase = await Purchase.findOne({ where: { stripeCheckoutSessionId: session.id }, include: [{ model: Product }] });
    if (purchase) {
      const purchasedAt = new Date();
      let serviceEndsAt = null;
      if (purchase.Product?.billingType === 'one_time' && purchase.Product.deliveryDurationDays) {
        serviceEndsAt = new Date(purchasedAt.getTime() + purchase.Product.deliveryDurationDays * 24 * 60 * 60 * 1000);
      }
      await purchase.update({
        status: 'active',
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
        purchasedAt,
        serviceEndsAt
      });
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await Purchase.update({ status: 'canceled' }, { where: { stripeSubscriptionId: sub.id } });
  }
  res.json({ received: true });
});
module.exports = router;

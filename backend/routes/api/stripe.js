const express = require('express');
const Stripe = require('stripe');
const { Purchase, Product } = require('../../db/models');
const { syncStripeSubscription } = require('../../utils/stripe-sync');
const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Stripe webhook is not configured.');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const purchase = await Purchase.findOne({
        where: { stripeCheckoutSessionId: session.id },
        include: [{ model: Product }]
      });

      if (purchase) {
        const purchasedAt = new Date();
        let serviceEndsAt = null;

        if (purchase.Product?.billingType === 'one_time' && purchase.Product.deliveryDurationDays) {
          serviceEndsAt = new Date(
            purchasedAt.getTime() +
            purchase.Product.deliveryDurationDays * 24 * 60 * 60 * 1000
          );
        }

        await purchase.update({
          status: 'active',
          stripePaymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
          stripeSubscriptionId:
            typeof session.subscription === 'string' ? session.subscription : null,
          purchasedAt,
          serviceEndsAt
        });
      }

      if (typeof session.subscription === 'string') {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ['items.data.price.product']
          });
          await syncStripeSubscription(subscription, stripe);
        } catch (err) {
          console.error('Stripe subscription reconciliation failed after checkout:', err);
        }
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncStripeSubscription(event.data.object, stripe);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing failed:', err);
    res.status(500).send('Webhook processing failed.');
  }
});

module.exports = router;

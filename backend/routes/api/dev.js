const express = require('express');
const { Product, Purchase } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

// These routes should never exist in production.
if (process.env.NODE_ENV === 'production') {
  router.use((_req, _res, next) => {
    const err = new Error('Development tools are disabled.');
    err.status = 404;
    next(err);
  });
} else {
  router.use(requireAuth);

  // Simulate purchasing / activating a program.
  router.post('/programs/:productId/activate', async (req, res, next) => {
    try {
      if (req.user.isTrainer) {
        const err = new Error(
          'Use a client account for local purchase simulation.'
        );
        err.status = 400;
        throw err;
      }

      const product = await Product.findByPk(req.params.productId);

      if (!product || !product.active) {
        const err = new Error('Product not found.');
        err.status = 404;
        throw err;
      }

      // Don't create another active copy if one already exists.
      const existingActive = await Purchase.findOne({
        where: {
          userId: req.user.id,
          productId: product.id,
          status: 'active'
        },
        order: [['createdAt', 'DESC']]
      });

      if (existingActive) {
        return res.json({
          purchase: existingActive,
          alreadyActive: true
        });
      }

      const purchasedAt = new Date();

      const serviceEndsAt =
        product.billingType === 'one_time' && product.deliveryDurationDays
          ? new Date(
              purchasedAt.getTime() +
                Number(product.deliveryDurationDays) *
                  24 *
                  60 *
                  60 *
                  1000
            )
          : null;

      // Important:
      // If you canceled this product previously, this creates a NEW row.
      // That lets us reproduce the exact cancel -> resubscribe duplicate-card case.
      const purchase = await Purchase.create({
        userId: req.user.id,
        productId: product.id,
        amountCents: product.priceCents,
        status: 'active',
        purchasedAt,
        serviceEndsAt
      });

      res.status(201).json({
        purchase,
        simulated: true
      });
    } catch (err) {
      next(err);
    }
  });

  // Simulate canceling a program.
  router.post('/programs/:productId/cancel', async (req, res, next) => {
    try {
      if (req.user.isTrainer) {
        const err = new Error(
          'Use a client account for local purchase simulation.'
        );
        err.status = 400;
        throw err;
      }

      const product = await Product.findByPk(req.params.productId);

      if (!product || !product.active) {
        const err = new Error('Product not found.');
        err.status = 404;
        throw err;
      }

      const [updated] = await Purchase.update(
        {
          status: 'canceled'
        },
        {
          where: {
            userId: req.user.id,
            productId: product.id,
            status: 'active'
          }
        }
      );

      res.json({
        canceled: updated,
        simulated: true
      });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = router;
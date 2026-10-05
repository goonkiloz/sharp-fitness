const express = require('express');
const { User, Purchase, Product, ClientFile, ContactRequest } = require('../../db/models');
const { requireTrainer, safeUser } = require('../../utils/auth');
const { createUploadUrl, deleteObject } = require('../../utils/storage');
const { getContentDeliveryEntitlement, getContentDeliveryOptions, calculatedServiceEnd } = require('../../utils/entitlements');
const { syncStripeCustomerSubscriptions } = require('../../utils/stripe-sync');
const router = express.Router();
router.use(requireTrainer);

function collapsePurchases(purchases = []) {
  const byProduct = new Map();

  for (const purchase of purchases) {
    const existing = byProduct.get(purchase.productId);
    if (!existing) {
      byProduct.set(purchase.productId, purchase);
      continue;
    }

    const purchaseIsActive = purchase.status === 'active';
    const existingIsActive = existing.status === 'active';

    if (purchaseIsActive && !existingIsActive) {
      byProduct.set(purchase.productId, purchase);
      continue;
    }

    if (purchaseIsActive === existingIsActive) {
      const purchaseTime = new Date(purchase.purchasedAt || purchase.createdAt || 0).getTime();
      const existingTime = new Date(existing.purchasedAt || existing.createdAt || 0).getTime();
      if (purchaseTime > existingTime) byProduct.set(purchase.productId, purchase);
    }
  }

  return Array.from(byProduct.values());
}

router.get('/dashboard', async (_req, res) => {
  const syncCandidates = await User.findAll({
    where: { isTrainer: false },
    attributes: ['id', 'stripeCustomerId']
  });

  await Promise.all(syncCandidates.map(async client => {
    if (!client.stripeCustomerId) return;
    try {
      await syncStripeCustomerSubscriptions(client);
    } catch (err) {
      console.error(`Stripe reconciliation failed for client ${client.id}:`, err);
    }
  }));

  const clients = await User.findAll({
    where: { isTrainer: false },
    attributes: ['id','firstName','lastName','email','createdAt'],
    include: [
      { model: Purchase, include: [{ model: Product }], required: false },
      { model: ClientFile, as: 'ClientFiles', include: [{ model: Product }], required: false }
    ],
    order: [['createdAt','DESC']]
  });

  const contacts = await ContactRequest.findAll({
    order: [['createdAt','DESC']],
    limit: 100
  });

  const enrichedClients = await Promise.all(clients.map(async client => {
    const plain = client.toJSON();
    plain.Purchases = collapsePurchases(plain.Purchases);

    const options = await getContentDeliveryOptions(client.id);
    plain.deliveryPrograms = options.map(option => ({
      productId: option.product.id,
      name: option.product.name,
      billingType: option.product.billingType,
      reason: option.reason,
      serviceEndsAt: option.serviceEndsAt || null
    }));

    plain.canReceiveNewContent = plain.deliveryPrograms.length > 0;

    const first = options[0];
    plain.deliveryReason = first?.reason || 'no_current_delivery_entitlement';
    plain.deliveryEndsAt =
      first?.serviceEndsAt ||
      (first?.purchase ? calculatedServiceEnd(first.purchase) : null);

    return plain;
  }));

  res.json({
    trainer: safeUser(_req.user),
    clients: enrichedClients,
    contacts
  });
});

router.post('/uploads/presign', async (req, res, next) => {
  try {
    const { userId, productId, originalName, mimeType, sizeBytes } = req.body;

    if (!userId || !productId || !originalName || !mimeType || !sizeBytes) {
      const err = new Error('Client, program, file name, file type, and file size are required.');
      err.status = 400;
      throw err;
    }

    if (Number(sizeBytes) > 2 * 1024 * 1024 * 1024) {
      const err = new Error('File is too large. Maximum supported file size is 2 GB.');
      err.status = 413;
      throw err;
    }

    const client = await User.findByPk(userId);
    if (!client || client.isTrainer) {
      const err = new Error('Client not found.');
      err.status = 404;
      throw err;
    }

    const entitlement = await getContentDeliveryEntitlement(client.id, productId);
    if (!entitlement.allowed) {
      const err = new Error('This client is not currently eligible to receive new material for that program. Existing files remain available to them.');
      err.status = 409;
      throw err;
    }

    const signed = await createUploadUrl({
      userId: client.id,
      productId: entitlement.product.id,
      filename: originalName,
      mimeType
    });

    res.json(signed);
  } catch (err) {
    next(err);
  }
});

router.post('/uploads/complete', async (req, res, next) => {
  try {
    const {
      userId,
      productId,
      title,
      description,
      storageKey,
      originalName,
      mimeType,
      sizeBytes
    } = req.body;

    if (!userId || !productId || !title?.trim() || !storageKey || !originalName || !mimeType || !sizeBytes) {
      const err = new Error('Missing upload information.');
      err.status = 400;
      throw err;
    }

    const client = await User.findByPk(userId);
    if (!client || client.isTrainer) {
      const err = new Error('Client not found.');
      err.status = 404;
      throw err;
    }

    const expectedPrefix = `clients/${client.id}/program-${Number(productId)}/`;
    if (!String(storageKey).startsWith(expectedPrefix)) {
      const err = new Error('Invalid storage key.');
      err.status = 400;
      throw err;
    }

    const entitlement = await getContentDeliveryEntitlement(client.id, productId);
    if (!entitlement.allowed) {
      const err = new Error('This client is not currently eligible to receive new material for that program. Existing files remain available to them.');
      err.status = 409;
      throw err;
    }

    const file = await ClientFile.create({
      userId: client.id,
      uploadedById: req.user.id,
      productId: entitlement.product.id,
      title: title.trim().slice(0, 200),
      description: description?.trim().slice(0, 5000) || null,
      storageKey,
      originalName: String(originalName).slice(0, 500),
      mimeType: String(mimeType).slice(0, 200),
      sizeBytes: Number(sizeBytes)
    });

    const created = await ClientFile.findByPk(file.id, {
      include: [{ model: Product }]
    });

    res.status(201).json({ file: created });
  } catch (err) {
    next(err);
  }
});

router.delete('/files/:id', async (req, res, next) => {
  try {
    const file = await ClientFile.findByPk(req.params.id);
    if (!file) {
      const err = new Error('File not found.');
      err.status = 404;
      throw err;
    }

    try {
      await deleteObject(file.storageKey);
    } catch (err) {
      console.error('S3 delete failed:', err);
    }

    await file.destroy();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch('/contacts/:id', async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['new','contacted','closed'].includes(status)) {
      const err = new Error('Invalid contact status.');
      err.status = 400;
      throw err;
    }

    const contact = await ContactRequest.findByPk(req.params.id);
    if (!contact) {
      const err = new Error('Contact request not found.');
      err.status = 404;
      throw err;
    }

    await contact.update({ status });
    res.json({ contact });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

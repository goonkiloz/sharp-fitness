const express = require('express');
const { User, Purchase, Product, ClientFile, ContactRequest } = require('../../db/models');
const { requireTrainer, safeUser } = require('../../utils/auth');
const { createUploadUrl, deleteObject } = require('../../utils/storage');
const { getContentDeliveryEntitlement, calculatedServiceEnd } = require('../../utils/entitlements');
const router = express.Router();
router.use(requireTrainer);

router.get('/dashboard', async (_req, res) => {
  const clients = await User.findAll({
    where: { isTrainer: false },
    attributes: ['id','firstName','lastName','email','createdAt'],
    include: [
      { model: Purchase, include: [{ model: Product }], required: false },
      { model: ClientFile, as: 'ClientFiles', required: false }
    ],
    order: [['createdAt','DESC']]
  });
  const contacts = await ContactRequest.findAll({ order: [['createdAt','DESC']], limit: 100 });
  const enrichedClients = await Promise.all(clients.map(async client => {
    const plain = client.toJSON();
    const entitlement = await getContentDeliveryEntitlement(client.id);
    plain.canReceiveNewContent = entitlement.allowed;
    plain.deliveryReason = entitlement.reason;
    plain.deliveryEndsAt = entitlement.serviceEndsAt || (entitlement.purchase ? calculatedServiceEnd(entitlement.purchase) : null);
    return plain;
  }));
  res.json({ trainer: safeUser(_req.user), clients: enrichedClients, contacts });
});

router.post('/uploads/presign', async (req, res, next) => {
  try {
    const { userId, originalName, mimeType, sizeBytes } = req.body;
    if (!userId || !originalName || !mimeType || !sizeBytes) {
      const err = new Error('Client, file name, file type, and file size are required.'); err.status = 400; throw err;
    }
    if (Number(sizeBytes) > 2 * 1024 * 1024 * 1024) {
      const err = new Error('File is too large. Maximum supported file size is 2 GB.'); err.status = 413; throw err;
    }
    const client = await User.findByPk(userId);
    if (!client || client.isTrainer) { const err = new Error('Client not found.'); err.status = 404; throw err; }
    const entitlement = await getContentDeliveryEntitlement(client.id);
    if (!entitlement.allowed) { const err = new Error('This client is not currently eligible to receive new program material. Existing files remain available to them.'); err.status = 409; throw err; }
    const signed = await createUploadUrl({ userId: client.id, filename: originalName, mimeType });
    res.json(signed);
  } catch (err) { next(err); }
});

router.post('/uploads/complete', async (req, res, next) => {
  try {
    const { userId, title, description, storageKey, originalName, mimeType, sizeBytes } = req.body;
    if (!userId || !title?.trim() || !storageKey || !originalName || !mimeType || !sizeBytes) {
      const err = new Error('Missing upload information.'); err.status = 400; throw err;
    }
    const client = await User.findByPk(userId);
    if (!client || client.isTrainer) { const err = new Error('Client not found.'); err.status = 404; throw err; }
    if (!String(storageKey).startsWith(`clients/${client.id}/`)) { const err = new Error('Invalid storage key.'); err.status = 400; throw err; }
    const entitlement = await getContentDeliveryEntitlement(client.id);
    if (!entitlement.allowed) { const err = new Error('This client is not currently eligible to receive new program material. Existing files remain available to them.'); err.status = 409; throw err; }
    const file = await ClientFile.create({
      userId: client.id,
      uploadedById: req.user.id,
      title: title.trim().slice(0, 200),
      description: description?.trim().slice(0, 5000) || null,
      storageKey,
      originalName: String(originalName).slice(0, 500),
      mimeType: String(mimeType).slice(0, 200),
      sizeBytes: Number(sizeBytes)
    });
    res.status(201).json({ file });
  } catch (err) { next(err); }
});

router.delete('/files/:id', async (req, res, next) => {
  try {
    const file = await ClientFile.findByPk(req.params.id);
    if (!file) { const err = new Error('File not found.'); err.status = 404; throw err; }
    try { await deleteObject(file.storageKey); } catch (err) { console.error('S3 delete failed:', err); }
    await file.destroy();
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch('/contacts/:id', async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['new','contacted','closed'].includes(status)) { const err = new Error('Invalid contact status.'); err.status = 400; throw err; }
    const contact = await ContactRequest.findByPk(req.params.id);
    if (!contact) { const err = new Error('Contact request not found.'); err.status = 404; throw err; }
    await contact.update({ status });
    res.json({ contact });
  } catch (err) { next(err); }
});

module.exports = router;

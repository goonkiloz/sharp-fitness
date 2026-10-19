const express = require('express');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { SiteContent } = require('../../db/models');
const { requireTrainer } = require('../../utils/auth');
const { images, validateTextChanges } = require('../../utils/site-content');

const router = express.Router();
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const maxUpload = 8 * 1024 * 1024;

function invalid(message, code = 400) {
  const error = new Error(message);
  error.status = code;
  return error;
}

function storage() {
  if (!process.env.S3_BUCKET || !process.env.S3_REGION) throw invalid('Image storage is not configured.', 503);
  return new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
  });
}

async function record() {
  const [site] = await SiteContent.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1, draft: {}, published: {}, previous: null }
  });
  return site;
}

function slotFromRequest(req) {
  const slot = req.params.slot || req.body?.slot;
  if (!images.has(slot)) throw invalid('Unknown editable image.', 400);
  return slot;
}

// Public visitors receive only published text and image references.
router.get('/', async (_req, res) => {
  const site = await record();
  res.json({ published: site.published || {}, publishedAt: site.publishedAt });
});

router.get('/editor', requireTrainer, async (_req, res) => {
  const site = await record();
  res.json({
    draft: site.draft || {},
    published: site.published || {},
    publishedAt: site.publishedAt,
    canRestore: site.previous != null
  });
});

router.put('/draft', requireTrainer, async (req, res, next) => {
  try {
    const changes = req.body?.changes;
    const message = validateTextChanges(changes);
    if (message) throw invalid(message);
    const site = await record();
    const nextDraft = { ...(site.draft || {}), ...changes };
    await site.update({ draft: nextDraft });
    res.json({ draft: nextDraft });
  } catch (err) { next(err); }
});

router.post('/publish', requireTrainer, async (_req, res, next) => {
  try {
    const site = await record();
    const published = { ...(site.draft || {}) };
    const previous = { ...(site.published || {}) };
    await site.update({ draft: published, published, previous, publishedAt: new Date() });
    res.json({ published, publishedAt: site.publishedAt, canRestore: true });
  } catch (err) { next(err); }
});

router.post('/restore', requireTrainer, async (_req, res, next) => {
  try {
    const site = await record();
    if (site.previous == null) throw invalid('No prior published version is available.', 409);
    const published = { ...site.previous };
    const previous = { ...(site.published || {}) };
    await site.update({ draft: published, published, previous, publishedAt: new Date() });
    res.json({ draft: published, published, publishedAt: site.publishedAt, canRestore: true });
  } catch (err) { next(err); }
});

// Image uploads are restricted to the trainer and to a short allowlist of image slots.
router.post('/images/presign', requireTrainer, async (req, res, next) => {
  try {
    const slot = slotFromRequest(req);
    const { mimeType, sizeBytes } = req.body || {};
    if (!Object.hasOwn(types, mimeType)) throw invalid('Use JPEG, PNG, or WebP images.');
    if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > maxUpload) {
      throw invalid('Images must be smaller than 8 MB.');
    }
    const key = 'site/' + slot.replace('.', '/') + '/' + crypto.randomUUID() + '.' + types[mimeType];
    const client = storage();
    const url = await getSignedUrl(client, new PutObjectCommand({
      Bucket: process.env.S3_BUCKET, Key: key, ContentType: mimeType
    }), { expiresIn: 300 });
    res.json({ key, uploadUrl: url });
  } catch (err) { next(err); }
});

router.post('/images/complete', requireTrainer, async (req, res, next) => {
  try {
    const slot = slotFromRequest(req);
    const { key } = req.body || {};
    const prefix = 'site/' + slot.replace('.', '/') + '/';
    if (typeof key !== 'string' ||
      !key.startsWith(prefix) ||
      !/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key.slice(prefix.length))) throw invalid('Invalid uploaded image key.');
    const client = storage();
    const head = await client.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    if (!head.ContentLength || head.ContentLength > maxUpload || !Object.hasOwn(types, head.ContentType)) {
      throw invalid('The uploaded image did not pass validation.');
    }
    const site = await record();
    const draft = { ...(site.draft || {}), [slot]: key };
    await site.update({ draft });
    res.json({ slot, value: key, draft });
  } catch (err) { next(err); }
});

// Stable application URL for both published and trainer-only draft images.
// This redirects to an expiring private S3 GET URL, keeping the bucket private.
router.get('/images/:slot', async (req, res, next) => {
  try {
    const slot = slotFromRequest(req);
    if (req.query.draft === '1') {
      if (!req.user || !req.user.isTrainer) throw invalid('Trainer access required.', 403);
    }
    const site = await record();
    const values = req.query.draft === '1' ? site.draft : site.published;
    const key = values?.[slot];
    if (typeof key !== 'string' || !key.startsWith('site/' + slot.replace('.', '/') + '/')) {
      throw invalid('Image not found.', 404);
    }
    const url = await getSignedUrl(storage(), new GetObjectCommand({
      Bucket: process.env.S3_BUCKET, Key: key
    }), { expiresIn: 300 });
    res.set('Cache-Control', 'private, no-store');
    res.redirect(302, url);
  } catch (err) { next(err); }
});

module.exports = router;

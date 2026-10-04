const express = require('express');
const { ClientFile } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { createDownloadUrl } = require('../../utils/storage');
const router = express.Router();

router.get('/:id/access', requireAuth, async (req, res, next) => {
  try {
    const file = await ClientFile.findByPk(req.params.id);
    if (!file) { const err = new Error('File not found.'); err.status = 404; throw err; }

    if (!req.user.isTrainer) {
      if (file.userId !== req.user.id) { const err = new Error('You do not have access to this file.'); err.status = 403; throw err; }
      // Files already assigned to a client remain theirs permanently, even after monthly coaching ends.
    }

    const url = await createDownloadUrl(file.storageKey, file.originalName);
    res.json({ url, expiresIn: 300 });
  } catch (err) { next(err); }
});

module.exports = router;

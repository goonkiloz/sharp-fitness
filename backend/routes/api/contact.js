const express = require('express');
const { ContactRequest } = require('../../db/models');
const { sendConsultNotification } = require('../../utils/mailer');
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, contact, goal, interestedIn, message } = req.body;
    if (!name?.trim() || !contact?.trim()) {
      const err = new Error('Your name and phone or email are required.');
      err.status = 400;
      throw err;
    }
    const request = await ContactRequest.create({
      name: name.trim().slice(0, 120),
      contact: contact.trim().slice(0, 200),
      goal: goal?.trim().slice(0, 200) || null,
      interestedIn: interestedIn?.trim().slice(0, 200) || null,
      message: message?.trim().slice(0, 5000) || null
    });

    try {
      const result = await sendConsultNotification(request);
      await request.update({ notificationSent: result.sent, notificationError: result.error });
    } catch (mailError) {
      console.error('Consult notification email failed:', mailError);
      await request.update({ notificationSent: false, notificationError: String(mailError.message || mailError).slice(0, 2000) });
    }

    res.status(201).json({
      ok: true,
      message: 'Thanks — your request was received. Cody will follow up using the contact information you provided.'
    });
  } catch (err) { next(err); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Subscription = require('../models/Subscription');
const adminAuth = require('../middleware/adminAuth');

// POST /api/subscribe -> Public: browser sends its push subscription here
// after the user allows notifications. We just save it.
router.post('/', async (req, res) => {
  try {
    const { subscription, appointmentId } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // upsert: if this browser already subscribed before, update it
    // instead of creating a duplicate
    await Subscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        appointmentId: appointmentId || undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, message: 'Subscribed to notifications' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// POST /api/subscribe/test -> Admin only: send a test notification to
// every saved subscription, useful to confirm the whole setup works.
router.post('/test', adminAuth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    const payload = JSON.stringify({
      title: 'Nan Care Hospital',
      body: 'This is a test notification — setup is working!',
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      )
    );

    res.json({
      sent: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

module.exports = router;

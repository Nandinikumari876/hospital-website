const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Appointment = require('../models/Appointment');
const Subscription = require('../models/Subscription');
const adminAuth = require('../middleware/adminAuth');
const { sendAppointmentEmail } = require('../lib/email'); // NEW

// POST /api/appointments  -> Public: create appointment request (from the website form)
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, department, message } = req.body;

    if (!fullName || !phone || !department) {
      return res.status(400).json({ error: 'fullName, phone and department are required' });
    }

    const appointment = await Appointment.create({
      fullName,
      phone,
      department,
      message,
    });

    // NEW: notify every admin browser that a new appointment came in
    try {
      const adminSubs = await Subscription.find({ isAdmin: true });
      const payload = JSON.stringify({
        title: 'New Appointment Request',
        body: `${fullName} requested ${department}. Phone: ${phone}`,
      });
      await Promise.allSettled(
        adminSubs.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload
          )
        )
      );
    } catch (pushErr) {
      console.error('Admin push notification failed:', pushErr.message);
    }

    // NEW: send email notification to admin
    try {
      await sendAppointmentEmail({
        to: 'nandnienterprises1@gmail.com', // apna admin email yaha daalo
        fullName,
        department,
        phone,
      });
    } catch (emailErr) {
      console.error('Admin email notification failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Appointment request received. Our desk will call you shortly to confirm your slot.",
      appointment,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ... baaki routes (GET, PATCH, DELETE) waise hi rahenge
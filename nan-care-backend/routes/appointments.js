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

// GET /api/appointments  -> Admin only: list all appointments
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// PATCH /api/appointments/:id  -> Admin only: update status
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // NEW: send a confirmation push to the patient when status becomes 'confirmed'
    if (status === 'confirmed') {
      try {
        const patientSubs = await Subscription.find({
          appointmentId: appointment._id,
          isAdmin: false,
        });
        const payload = JSON.stringify({
          title: 'Nan Care Hospital',
          body: `Your appointment for ${appointment.department} has been confirmed.`,
        });
        await Promise.allSettled(
          patientSubs.map((sub) =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            )
          )
        );
      } catch (pushErr) {
        console.error('Patient confirmation push failed:', pushErr.message);
      }
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id  -> Admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;
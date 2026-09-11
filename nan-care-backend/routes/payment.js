const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Appointment = require('../models/Appointment');
const patientAuth = require('../middleware/patientAuth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order -> Patient only: create a Razorpay order
router.post('/create-order', patientAuth, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.email !== req.user.email) {
      return res.status(403).json({ error: 'This appointment does not belong to you' });
    }
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ error: 'Payment is only available after the appointment is confirmed' });
    }
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This appointment is already paid' });
    }

    const order = await razorpay.orders.create({
      amount: appointment.amount * 100, // Razorpay expects paise
      currency: 'INR',
      receipt: `appt_${appointment._id}`,
    });

    appointment.razorpayOrderId = order.id;
    await appointment.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      appointmentId: appointment._id,
    });
    } catch (err) {
    console.error('create-order failed:', err);
    res.status(500).json({ error: 'Failed to create payment order', details: err.error?.description || err.message });
  }
});

// POST /api/payment/verify -> Patient only: verify payment signature

// POST /api/payment/verify -> Patient only: verify payment signature
router.post('/verify', patientAuth, async (req, res) => {
  try {
    const {
      appointmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!appointmentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.email !== req.user.email) {
      return res.status(403).json({ error: 'This appointment does not belong to you' });
    }

    appointment.paymentStatus = 'paid';
    appointment.razorpayPaymentId = razorpay_payment_id;
    await appointment.save();

    res.json({ success: true, appointment });
  } catch (err) {
    console.error('payment verify failed:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
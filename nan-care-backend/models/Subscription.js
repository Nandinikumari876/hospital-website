const mongoose = require('mongoose');

// Stores one browser's Web Push subscription. A subscription is created
// automatically by the browser when the user allows notifications — we
// just receive it from the frontend and save it here so we can push to
// it later (e.g. when an appointment gets confirmed).
const subscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true, // prevents saving the same browser twice
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    // Optional: link this subscription to a specific appointment, so we
    // know exactly who to notify when that appointment is confirmed.
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
        isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);

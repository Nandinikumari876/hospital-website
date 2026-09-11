const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone must be a 10-digit number'],
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
     amount: {
      type: Number,
      default: 500, // यहां अपनी असली consultation fee डालें (रुपयों में)
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
     appointmentDate: {
      type: String, // e.g. "2026-09-15"
      default: null,
    },
    appointmentTime: {
      type: String, // e.g. "11:30 AM"
      default: null,
    },
  },
  { timestamps: true },
  
);

module.exports = mongoose.model('Appointment', appointmentSchema);

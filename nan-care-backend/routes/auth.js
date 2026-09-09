const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../lib/otpEmail');

const OTP_EXPIRY_MINUTES = 5;
const JWT_EXPIRY = '7d';

function generateOtpCode() {
  // 6-digit numeric code, e.g. "042381"
  return crypto.randomInt(100000, 1000000).toString();
}

// POST /api/auth/send-otp -> Public: send a login/signup code to the given email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({
      email: email.toLowerCase().trim(),
      code,
      expiresAt,
    });

    await sendOtpEmail({ to: email, code });

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('send-otp failed:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp -> Public: verify code, create user if needed, issue JWT
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      code,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ _id: -1 });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    otpRecord.used = true;
    await otpRecord.save();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({ email: normalizedEmail });
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      success: true,
      token,
      user: { email: user.email, id: user._id },
    });
  } catch (err) {
    console.error('verify-otp failed:', err.message);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
});

module.exports = router;
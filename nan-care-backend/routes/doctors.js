const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const adminAuth = require('../middleware/adminAuth');

// GET /api/doctors -> Public: list all doctors (for the website)
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ order: 1, name: 1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// POST /api/doctors -> Admin only: add a doctor
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, initials, color, role, bio, department, order } = req.body;
    if (!name || !initials || !role) {
      return res.status(400).json({ error: 'name, initials and role are required' });
    }
    const doctor = await Doctor.create({ name, initials, color, role, bio, department, order });
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

// PUT /api/doctors/:id -> Admin only: edit a doctor
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// DELETE /api/doctors/:id -> Admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const adminAuth = require('../middleware/adminAuth');

// GET /api/departments -> Public: list all departments (for the website)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ order: 1, title: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/departments -> Admin only: add a department
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, desc, order } = req.body;
    if (!title || !desc) {
      return res.status(400).json({ error: 'title and desc are required' });
    }
    const department = await Department.create({ title, desc, order });
    res.status(201).json(department);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A department with this title already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/departments/:id -> Admin only: edit a department
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/departments/:id -> Admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;

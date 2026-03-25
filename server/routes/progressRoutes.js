const express = require('express');
const router = express.Router();
const Progress = require('../models/mongo/Progress');
const auth = require('../middleware/authMiddleware');

// Add progress
router.post('/', auth, async (req, res) => {
  try {
    const newProgress = new Progress({
      userId: req.user.id,
      ...req.body
    });

    await newProgress.save();
    res.json(newProgress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all progress
router.get('/', auth, async (req, res) => {
  const data = await Progress.find({ userId: req.user.id }).sort({ date: -1 });
  res.json(data);
});

module.exports = router;
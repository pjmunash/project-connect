const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('./auth');

// GET /api/users/me/profile - returns user profile
router.get('/me/profile', requireAuth, async (req, res) => {
  try{
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ profile: user.profile || {}, gamification: user.gamification || {}, user: { id: user._id, email: user.email, role: user.role } });
  }catch(e){ console.error(e); res.status(500).json({ message: 'Server error' }) }
});

// POST /api/users/me/profile - update profile (skills, education, projects)
router.post('/me/profile', requireAuth, async (req, res) => {
  try{
    const data = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.profile = { ...(user.profile || {}), ...(data.profile || {}) };
    await user.save();
    res.json({ profile: user.profile });
  }catch(e){ console.error(e); res.status(500).json({ message: 'Server error' }) }
});

module.exports = router;

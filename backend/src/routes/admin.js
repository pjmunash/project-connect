const express = require('express');
const { getAdmin } = require('../firebaseAdmin');
const User = require('../models/User');

const router = express.Router();

// Simple auth: require ADMIN_API_KEY header or query param for these dev tools
function requireAdminKey(req, res, next){
  const key = process.env.ADMIN_API_KEY;
  if (!key) return res.status(403).json({ message: 'Admin API key not configured on server' });
  const provided = req.headers['x-admin-key'] || req.query.key || (req.body && req.body.key);
  if (provided !== key) return res.status(403).json({ message: 'Invalid admin key' });
  next();
}

// GET /api/admin/check?email=foo - returns firebase user info (emailVerified)
router.get('/check', requireAdminKey, async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ message: 'Missing email' });
  const adm = getAdmin();
  if (!adm) return res.status(500).json({ message: 'Firebase admin not configured' });
  try{
    const user = await adm.auth().getUserByEmail(email);
    res.json({ email: user.email, emailVerified: user.emailVerified, uid: user.uid });
  }catch(e){
    res.status(404).json({ message: 'User not found in Firebase', detail: e.message });
  }
});

// POST /api/admin/toggle-verified { email } - toggle emailVerified state (dev only)
router.post('/toggle-verified', requireAdminKey, async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ message: 'Missing email' });
  const adm = getAdmin();
  if (!adm) return res.status(500).json({ message: 'Firebase admin not configured' });
  try{
    const user = await adm.auth().getUserByEmail(email);
    const newVal = !user.emailVerified;
    const updated = await adm.auth().updateUser(user.uid, { emailVerified: newVal });
    // sync Mongo User if present
    const mongoUser = await User.findOne({ email });
    if (mongoUser){ mongoUser.verified = newVal; await mongoUser.save(); }
    res.json({ email: updated.email, emailVerified: updated.emailVerified });
  }catch(e){
    res.status(404).json({ message: 'User not found in Firebase', detail: e.message });
  }
});

module.exports = router;

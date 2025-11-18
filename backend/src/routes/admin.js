const express = require('express');
const { getAdmin } = require('../firebaseAdmin');
const User = require('../models/User');
const Internship = require('../models/Internship');

// Helper middleware: if ADMIN_API_KEY is configured require it, otherwise allow (convenience for local dev)
function requireAdminFlexible(req, res, next){
  const key = process.env.ADMIN_API_KEY;
  if (!key){
    // No admin key configured — allow in local/dev but log a warning
    console.warn('ADMIN_API_KEY not set; allowing admin endpoints without authentication (local dev only)');
    return next();
  }
  const provided = req.headers['x-admin-key'] || req.query.key || (req.body && req.body.key);
  if (provided !== key) return res.status(403).json({ message: 'Invalid admin key' });
  return next();
}

const router = express.Router();


function requireAdminKey(req, res, next){
  const key = process.env.ADMIN_API_KEY;
  if (!key) return res.status(403).json({ message: 'Admin API key not configured on server' });
  const provided = req.headers['x-admin-key'] || req.query.key || (req.body && req.body.key);
  if (provided !== key) return res.status(403).json({ message: 'Invalid admin key' });
  next();
}


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


router.post('/toggle-verified', requireAdminKey, async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ message: 'Missing email' });
  const adm = getAdmin();
  if (!adm) return res.status(500).json({ message: 'Firebase admin not configured' });
  try{
    const user = await adm.auth().getUserByEmail(email);
    const newVal = !user.emailVerified;
    const updated = await adm.auth().updateUser(user.uid, { emailVerified: newVal });
    
    const mongoUser = await User.findOne({ email });
    if (mongoUser){ mongoUser.verified = newVal; await mongoUser.save(); }
    res.json({ email: updated.email, emailVerified: updated.emailVerified });
  }catch(e){
    res.status(404).json({ message: 'User not found in Firebase', detail: e.message });
  }
});


// Admin system overview (internships, users, universities)
router.get('/system', requireAdminFlexible, async (req, res) => {
  try{
    const internships = await Internship.find({}).populate('postedBy').lean();
    const users = await User.find({}).lean();
    // There is no University model in this project; return empty array for compatibility
    const universities = [];
    res.json({ internships, users, universities });
  }catch(e){
    console.error('Failed to fetch admin system data', e && (e.message || e));
    res.status(500).json({ message: 'Failed to fetch admin system data' });
  }
});

// Delete user
router.delete('/user/:id', requireAdminFlexible, async (req, res) => {
  try{
    const id = req.params.id;
    await User.findByIdAndDelete(id);
    res.json({ ok: true });
  }catch(e){
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Delete internship
router.delete('/internship/:id', requireAdminFlexible, async (req, res) => {
  try{
    const id = req.params.id;
    await Internship.findByIdAndDelete(id);
    res.json({ ok: true });
  }catch(e){
    res.status(500).json({ message: 'Failed to delete internship' });
  }
});

// Delete application from internship
router.delete('/internship/:internshipId/application/:appId', requireAdminFlexible, async (req, res) => {
  try{
    const { internshipId, appId } = req.params;
    const intern = await Internship.findById(internshipId);
    if (!intern) return res.status(404).json({ message: 'Internship not found' });
    intern.applicants = intern.applicants.filter(a => String(a._id) !== String(appId));
    await intern.save();
    res.json({ ok: true });
  }catch(e){
    res.status(500).json({ message: 'Failed to delete application' });
  }
});

module.exports = router;

const express = require('express');
const Internship = require('../models/Internship');
const User = require('../models/User');
const router = express.Router();
const { requireAuth, requireVerified } = require('./auth');

// Helper: find internship and ensure posting employer
async function ensureEmployerCanManage(internship, user){
  if (!internship) throw { status:404, message: 'Not found' };
  if (String(internship.postedBy) !== String(user.id) && user.role !== 'admin') throw { status:403, message: 'Forbidden' };
}

// List internships with simple filters
router.get('/', async (req, res) => {
  const { field, location, remote, paid } = req.query;
  const q = {};
  if (field) q.field = field;
  if (location) q.location = location;
  if (remote !== undefined) q.remote = remote === 'true';
  if (paid !== undefined) q.paid = paid === 'true';
  const items = await Internship.find(q).populate('postedBy','name email');
  res.json({ items });
});

// Post internship (employers only)
router.post('/', requireAuth, requireVerified, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'employer' && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const data = req.body;
  try{
    const internship = new Internship({ ...data, postedBy: user.id });
    await internship.save();
    return res.json({ internship });
  }catch(e){
    console.error('Create internship error', e && e.message || e);
    if (e && e.name === 'ValidationError') return res.status(400).json({ message: e.message, errors: e.errors });
    return res.status(500).json({ message: 'Server error' });
  }
});

// Apply to internship (students only) — includes resumeUrl, message and formAnswers
router.post('/:id/apply', requireAuth, requireVerified, async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'student' && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  // accept extra profile fields from the application form
  const { resumeUrl, message, university, degree, major, currentYear, skills, formAnswers } = req.body;
  try{
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (internship.applicants.some(a => String(a.user) === String(user.id))) return res.status(400).json({ message: 'Already applied' });
    internship.applicants.push({ user: user.id, resumeUrl, message, university, degree, major, currentYear, skills: Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map(s=>s.trim()).filter(Boolean) : []), formAnswers: formAnswers || {} });
    await internship.save();
    try{
      // increment user's gamification points and streak
      const u = await User.findById(user.id);
      if (u){
        u.gamification = u.gamification || { points:0, badges:[], applicationStreak:0 };
        u.gamification.points = (u.gamification.points || 0) + 5; // small points for applying
        u.gamification.applicationStreak = (u.gamification.applicationStreak || 0) + 1;
        await u.save();
      }
    }catch(e){ console.warn('Gamification update failed', e.message || e) }
    return res.json({ message: 'Applied' });
  }catch(e){
    console.error('Apply error', e && e.message || e);
    if (e && e.name === 'ValidationError') return res.status(400).json({ message: e.message, errors: e.errors });
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get applicants for an internship (employer who posted it)
router.get('/:id/applicants', requireAuth, async (req, res) => {
  const user = req.user;
  const internship = await Internship.findById(req.params.id).populate('applicants.user','name email profile');
  try{
    await ensureEmployerCanManage(internship, user);
  }catch(err){
    return res.status(err.status || 500).json({ message: err.message || 'Error' });
  }
  // return applicants and ensure form answers are passed through
  const apps = internship.applicants.map(a => a.toObject ? a.toObject() : a)
  res.json({ applicants: apps });
});

// Employer can update application status (accept/reject)
router.post('/:id/applicants/:appId/status', requireAuth, async (req, res) => {
  const user = req.user;
  try{
    const internship = await Internship.findById(req.params.id);
    try{ await ensureEmployerCanManage(internship, user); }catch(err){ return res.status(err.status||500).json({ message: err.message }) }
    const app = internship.applicants.id(req.params.appId);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const { status } = req.body;
    if (!['applied','pending','accepted','rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    app.status = status;
    await internship.save();
    return res.json({ application: app });
  }catch(e){
    console.error('Update application status error', e && e.message || e);
    const msg = e && e.message ? e.message : String(e);
    return res.status(500).json({ message: 'Server error', detail: msg });
  }
});

// Edit a posting
router.put('/:id', requireAuth, requireVerified, async (req, res) => {
  const user = req.user;
  try{
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    try{ await ensureEmployerCanManage(internship, user); }catch(err){ return res.status(err.status||500).json({ message: err.message }) }
    const data = req.body || {}
    // allow updating common fields
    ['title','description','field','location','remote','paid','company','requirements','duration','stipend','deadline'].forEach(k=>{ if (k in data) internship[k] = data[k] })
    await internship.save();
    return res.json({ internship });
  }catch(e){
    console.error('Edit internship error', e && e.message || e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a posting
router.delete('/:id', requireAuth, requireVerified, async (req, res) => {
  const user = req.user;
  try{
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    try{ await ensureEmployerCanManage(internship, user); }catch(err){ return res.status(err.status||500).json({ message: err.message }) }
    await internship.remove();
    return res.json({ ok: true });
  }catch(e){
    console.error('Delete internship error', e && e.message || e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Take down (unpublish) a posting without deleting
router.patch('/:id/takedown', requireAuth, requireVerified, async (req, res) => {
  const user = req.user;
  try{
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    try{ await ensureEmployerCanManage(internship, user); }catch(err){ return res.status(err.status||500).json({ message: err.message }) }
    internship.active = false;
    await internship.save();
    return res.json({ internship });
  }catch(e){
    console.error('Takedown error', e && e.message || e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Restore (publish) a previously taken-down posting
router.patch('/:id/restore', requireAuth, requireVerified, async (req, res) => {
  const user = req.user;
  try{
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    try{ await ensureEmployerCanManage(internship, user); }catch(err){ return res.status(err.status||500).json({ message: err.message }) }
    internship.active = true;
    await internship.save();
    return res.json({ internship });
  }catch(e){
    console.error('Restore error', e && e.message || e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// University: get all applications for a student by email or id
router.get('/student/applications', requireAuth, async (req, res) => {
  const user = req.user;
  // Accept either query by email/id (for university/admin) or no query to return current user's applications
  const qemail = req.query.email;
  const qid = req.query.id;
  let targetUser = null;
  if (qid) targetUser = await User.findById(qid);
  else if (qemail) targetUser = await User.findOne({ email: qemail });
  else targetUser = await User.findById(user.id);
  if (!targetUser) return res.status(404).json({ message: 'User not found' });
  if (user.role !== 'university' && user.role !== 'admin' && String(user.id) !== String(targetUser._id)) return res.status(403).json({ message: 'Forbidden' });
  // find internships where applicants.user == targetUser._id
  const internships = await Internship.find({ 'applicants.user': targetUser._id }).lean();
  // build a small public profile for the target user to include with each application
  const publicProfile = {
    _id: targetUser._id,
    name: targetUser.name,
    email: targetUser.email,
    verified: !!targetUser.verified,
    profile: targetUser.profile || {}
  }
  const results = internships.map(i => {
    const app = i.applicants.find(a=> String(a.user) === String(targetUser._id)) || null;
    // include the publicProfile under applicant.user for convenience
    const applicant = app ? ({ ...app, user: publicProfile }) : null;
    return {
      internshipId: i._id,
      title: i.title,
      company: i.company,
      location: i.location,
      field: i.field,
      applicant
    }
  });
  res.json({ applications: results });
});

module.exports = router;

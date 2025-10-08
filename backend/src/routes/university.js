const express = require('express');
const User = require('../models/User');
const { getAdmin } = require('../firebaseAdmin');
const authRoutes = require('./auth');

const router = express.Router();

const Internship = require('../models/Internship');

// requireAuth comes from auth router which exports it as a property
const requireAuth = authRoutes.requireAuth;

function requireRole(role){
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== role && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  }
}

// GET /api/university/students - list students (simple paging optional)
router.get('/students', requireAuth, requireRole('university'), async (req, res) => {
  try{
    const q = req.query.q || '';
    const filter = { role: 'student' };
    if (q) filter.email = { $regex: q, $options: 'i' };
    const students = await User.find(filter).select('-passwordHash').limit(200).lean();
    res.json({ students });
  }catch(e){
    console.error('university/students error', e.message || e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/university/students/:id/verify { verified: true|false }
router.post('/students/:id/verify', requireAuth, requireRole('university'), async (req, res) => {
  try{
    const id = req.params.id;
    const { verified } = req.body;
    if (typeof verified !== 'boolean') return res.status(400).json({ message: 'Missing verified boolean' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.verified = verified;
    await user.save();

    // If Firebase Admin available, try to sync emailVerified flag there too
    const adm = getAdmin();
    if (adm){
      try{
        const fbUser = await adm.auth().getUserByEmail(user.email);
        await adm.auth().updateUser(fbUser.uid, { emailVerified: !!verified });
      }catch(e){
        // ignore firebase update errors but log them
        console.warn('Failed to sync verification to Firebase for', user.email, e.message || e);
      }
    }

    res.json({ user: { id: user._id, email: user.email, verified: user.verified } });
  }catch(e){
    console.error('verify student error', e.message || e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/university/students/bulk
// Body: { emails: ['a@x.com','b@y.com'] } or { domain: 'kabarak.ac.ke' }
router.post('/students/bulk', requireAuth, requireRole('university'), async (req, res) => {
  try{
    const { emails, domain } = req.body || {};
    let filter = { role: 'student' };
    if (Array.isArray(emails) && emails.length > 0){
      // normalize
      const lower = emails.map(e => (e||'').trim().toLowerCase()).filter(Boolean);
      filter.email = { $in: lower };
    }else if (domain && typeof domain === 'string'){
      const d = domain.replace(/^[*@\s]+/, '').trim();
      filter.email = { $regex: `@${d.replace('.', '\\.')}$`, $options: 'i' };
    }else{
      return res.status(400).json({ message: 'Provide emails[] or domain' });
    }

    const users = await User.find(filter).select('name email verified profile').lean();
    // gather internship applications for these users
    const userIds = users.map(u => u._id);
    const internships = await Internship.find({ 'applicants.user': { $in: userIds } }).lean();

    // map userId to their applications
    const map = {};
    users.forEach(u => { map[String(u._id)] = { user: u, applications: [] } });
    internships.forEach(i => {
      (i.applicants || []).forEach(a => {
        if (!a.user) return;
        const key = String(a.user);
        if (map[key]){
          map[key].applications.push({
            internshipId: i._id,
            title: i.title,
            company: i.company,
            status: a.status,
            appliedAt: a.appliedAt,
            resumeUrl: a.resumeUrl,
            message: a.message
          })
        }
      })
    })

    const results = Object.values(map).map(v=>({
      user: v.user,
      applications: v.applications,
      counts: {
        total: v.applications.length,
        accepted: v.applications.filter(x=>x.status==='accepted').length
      }
    }))

    // aggregate stats
    const stats = {
      students: results.length,
      totalApplications: results.reduce((s,r)=>s + r.counts.total, 0),
      totalAccepted: results.reduce((s,r)=>s + r.counts.accepted, 0)
    }

    res.json({ stats, results });
  }catch(e){
    console.error('students/bulk error', e.message || e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


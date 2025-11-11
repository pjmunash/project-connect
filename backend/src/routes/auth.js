const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyIdToken } = require('../firebaseAdmin');

const router = express.Router();


router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
  const user = new User({ email, passwordHash: hash, name, role, verified: true });
    await user.save();

    

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, verified: user.verified } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.verified) return res.status(403).json({ message: 'Email not verified' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Missing auth token' });
  const token = auth.replace('Bearer ', '');

  // Try backend JWT first
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = payload;
    return next();
  } catch (e) {
    // not a backend token, try firebase id token
  }

  try {
    const decoded = await verifyIdToken(token);
    // decoded contains uid, email, name, email_verified, etc.
    // Ensure a corresponding Mongo user exists (or create minimal user record)
    let user = await User.findOne({ email: decoded.email });
    if (!user){
      user = new User({ email: decoded.email, name: decoded.name || decoded.email.split('@')[0], verified: !!decoded.email_verified, role: 'student' });
      await user.save();
    } else {
      // sync verification flag
      if (decoded.email_verified && !user.verified){ user.verified = true; await user.save(); }
    }
    // attach a consistent payload similar to JWT flow
    req.user = { id: user._id, role: user.role, firebaseUid: decoded.uid };
    return next();
  } catch (err) {
    console.error('Auth verify error', err.message || err);
    const msg = err && err.message ? err.message : String(err);
    // If firebase admin isn't configured (missing service account or package), surface a 500
    if (msg.toLowerCase().includes('not configured') || msg.toLowerCase().includes('not installed') || msg.toLowerCase().includes('service account')){
      return res.status(500).json({ message: 'Firebase admin not configured on server', detail: msg });
    }
    // Otherwise the token is invalid or expired — return 401 with a helpful detail
    return res.status(401).json({ message: 'Invalid token', detail: msg });
  }
}

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json({ user });
});

// Exchange Firebase ID token for backend JWT (optional convenience)
router.post('/firebase-exchange', async (req, res) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Missing idToken' });
    let decoded;
    try{
      decoded = await verifyIdToken(idToken);
    }catch(err){
      // distinguish missing admin setup vs invalid token
      const msg = err && err.message ? err.message : String(err);
      if (msg.includes('not configured') || msg.includes('not installed')){
        console.error('Firebase admin not configured:', msg);
        return res.status(500).json({ message: 'Firebase admin not configured on server' });
      }
      console.error('Invalid firebase idToken:', msg);
      return res.status(400).json({ message: 'Invalid firebase idToken', detail: msg });
    }
    let user = await User.findOne({ email: decoded.email });
    if (!user){
      user = new User({
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        verified: !!decoded.email_verified,
        role: role || 'student'
      });
      await user.save();
    } else {
      // sync verification flag
      if (decoded.email_verified && !user.verified){ user.verified = true; }
      // allow client to propose a role (only set if user has no role or role differs and is provided)
      if (role && user.role !== role){ user.role = role }
      await user.save();
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('exchange error', err.message || err);
    res.status(400).json({ message: 'Invalid firebase token' });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireVerified = function(req, res, next){
  // require that the underlying Mongo user is verified for student/employer actions
  (async ()=>{
    try{
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      const u = await User.findById(req.user.id);
      if (!u) return res.status(404).json({ message: 'User not found' });
      if ((u.role === 'student' || u.role === 'employer') && !u.verified) return res.status(403).json({ message: 'Account not verified' });
      // attach the fresh DB user to req.dbUser for downstream use
      req.dbUser = u;
      return next();
    }catch(e){ console.error('requireVerified error', e); return res.status(500).json({ message: 'Server error' }) }
  })();
}


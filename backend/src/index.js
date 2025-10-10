const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin');

const authRoutes = require('./routes/auth');
const internshipRoutes = require('./routes/internships');
const adminRoutes = require('./routes/admin');
const universityRoutes = require('./routes/university');
const uploadsRoutes = require('./routes/uploads');
const usersRoutes = require('./routes/users');

const app = express();

//  Updated CORS to allow frontend domain
app.use(cors({
  origin: ['https://pjmunash.github.io'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/users', usersRoutes);

// ✅Health check route for connectivity testing
app.get('/api/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/innterbridge-dev';

if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI not found in environment; falling back to', MONGO_URI);
} else {
  const masked = process.env.MONGO_URI.length > 60 ? process.env.MONGO_URI.slice(0, 60) + '...' : process.env.MONGO_URI;
  console.log('MONGO_URI loaded (masked):', masked);
}

<<<<<<< HEAD
// Firebase Admin initialization
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized');
} catch (e) {
  console.warn('Firebase admin init failed at startup', e.message || e);
}

=======
>>>>>>> e91cb22 (Describe your changes)
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // start HTTP server once DB is connected
    function tryListen(portToTry){
      const server = app.listen(portToTry, () => console.log(`Server running on port ${portToTry}`));
      server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE'){
          console.warn(`Port ${portToTry} in use, trying ${portToTry + 1}`);
          tryListen(portToTry + 1);
        } else {
          console.error('Server error', err.message || err);
        }
      });
    }
    tryListen(PORT);
  }catch(err){
    console.error('MongoDB connection error:', err && (err.message || err));
    // Exponential backoff with cap — useful for transient network issues or DB sleeping
    const maxDelayMs = 60 * 1000; // 1 minute
    const delay = Math.min(1000 * Math.pow(2, Math.min(retries, 6)), maxDelayMs);
    console.log(`Retrying MongoDB connection in ${delay}ms (attempt ${retries + 1})`);
    setTimeout(() => connectWithRetry(retries + 1), delay);
  }
}

// Start the initial connect attempt
connectWithRetry();


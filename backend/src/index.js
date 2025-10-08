require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const internshipRoutes = require('./routes/internships');
const adminRoutes = require('./routes/admin');
const universityRoutes = require('./routes/university');
const uploadsRoutes = require('./routes/uploads');
const usersRoutes = require('./routes/users');
const { initFirebaseAdmin } = require('./firebaseAdmin');

const app = express();
app.use(cors());
app.use(express.json());
// serve uploaded files
app.use('/uploads', express.static(require('path').resolve(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/users', usersRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/innterbridge-dev';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Attempt to initialize Firebase Admin at startup so failures are visible in server logs
    try{ initFirebaseAdmin(); }catch(e){ console.warn('Firebase admin init failed at startup', e.message || e) }

    // try to listen; if port is in use, try the next port to avoid crashing in dev
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
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

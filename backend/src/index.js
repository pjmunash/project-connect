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

// ✅ Updated CORS to allow frontend domain
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

// ✅ Health check route for connectivity testing
app.get('/api/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// Root status page - helpful for simple availability checks in a browser
app.get('/', (_, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Project Connect API</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial;margin:2rem;color:#111}a{color:#0366d6}</style>
      </head>
      <body>
        <h1>Project Connect API</h1>
        <p>Status: <strong>running</strong></p>
        <p>Try the health endpoint: <a href="/api/health">/api/health</a></p>
        <p>API base: <code>/api/</code></p>
        <p>If you expected a web frontend here, the frontend is deployed separately (e.g. GitHub Pages). See your project README for the frontend URL.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/innterbridge-dev';

if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI not found in environment; falling back to', MONGO_URI);
} else {
  const masked = process.env.MONGO_URI.length > 60 ? process.env.MONGO_URI.slice(0, 60) + '...' : process.env.MONGO_URI;
  
}

// Firebase Admin initialization (support multiple sources)
function initFirebaseFromEnv(){
  try{
    // 1) direct JSON in env
    if (process.env.FIREBASE_SERVICE_ACCOUNT){
      try{
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(parsed) });
        console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env');
        return true;
      }catch(e){
        console.warn('FIREBASE_SERVICE_ACCOUNT present but not valid JSON');
      }
    }

    // 2) base64 encoded JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64){
      try{
        const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const parsed = JSON.parse(json);
        admin.initializeApp({ credential: admin.credential.cert(parsed) });
        console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_BASE64 env');
        return true;
      }catch(e){
        console.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 present but invalid');
      }
    }

    // 3) file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH){
      const fp = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      try{
        const j = require(fp);
        admin.initializeApp({ credential: admin.credential.cert(j) });
        console.log('Firebase Admin initialized from file', fp);
        return true;
      }catch(e){
        console.warn('FIREBASE_SERVICE_ACCOUNT_PATH set but failed to load file', fp, e.message || e);
      }
    }
  }catch(e){
    console.error('Unexpected error initializing Firebase Admin', e.message || e);
  }
  console.warn('Firebase Admin not initialized (no valid credentials found)');
  return false;
}

initFirebaseFromEnv();

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
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

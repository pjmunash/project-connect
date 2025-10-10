const fs = require('fs');
const pathLib = require('path');
let admin = null;
let initialized = false;

function tryRequireAdmin(){
  if (admin) return admin;
  try {
    admin = require('firebase-admin');
    return admin;
  } catch (e){
    // firebase-admin not installed
    return null;
  }
}

function readJsonFile(filepath){
  try{
    const raw = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(raw);
  }catch(e){
    // fall through
    return null;
  }
}

function initFirebaseAdmin(){
  if (initialized) return;
  const adm = tryRequireAdmin();
  if (!adm){
    console.log('firebase-admin package not installed. Skipping Firebase Admin initialization.');
    return;
  }

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  let cred = null;
  const tried = [];

  try{
    if (base64){
      const json = Buffer.from(base64, 'base64').toString('utf8');
      cred = JSON.parse(json);
      tried.push('FIREBASE_SERVICE_ACCOUNT_BASE64 (env)');
      // If requested (or if no file exists), write the decoded service account to a file
      try{
        const writeFlag = (process.env.FIREBASE_SERVICE_ACCOUNT_WRITE || '').toLowerCase();
        const targetPath = pathLib.resolve(__dirname, '..', 'serviceAccount.json');
        if ((writeFlag === 'true' || writeFlag === '1') && !fs.existsSync(targetPath)){
          try{
            fs.writeFileSync(targetPath, JSON.stringify(cred, null, 2), { encoding: 'utf8' });
            // On *nix we'd set restrictive perms; on Windows this is best-effort
            try{ fs.chmodSync(targetPath, 0o600); }catch(e){}
            console.log('Wrote service account to', targetPath, '(FIREBASE_SERVICE_ACCOUNT_WRITE=true)');
            tried.push(`wrote:${targetPath}`);
          }catch(e){
            console.warn('Failed to write service account file:', e.message || e);
          }
        }
      }catch(e){ /* ignore write errors */ }
    } else if (envPath){
      const abs = pathLib.isAbsolute(envPath) ? envPath : pathLib.resolve(process.cwd(), envPath);
      tried.push(abs);
      if (fs.existsSync(abs)){
        const j = readJsonFile(abs);
        if (j) cred = j;
      }
    } else {
      // Try common default locations relative to project
      const candidates = [
        pathLib.resolve(__dirname, '..', 'serviceAccount.json'),
        pathLib.resolve(process.cwd(), 'serviceAccount.json'),
        pathLib.resolve(__dirname, 'serviceAccount.json')
      ];
      for (const c of candidates){
        tried.push(c);
        if (fs.existsSync(c)){
          const j = readJsonFile(c);
          if (j){ cred = j; break; }
          // fallback to require (in case it's a JS module)
          try{ cred = require(c); break; }catch(e){}
        }
      }
    }
  }catch(e){
    console.error('Failed to read firebase service account:', e.message || e);
  }

  if (cred){
    try{
      // If an app already exists, reuse it instead of initializing a new one.
      const already = (typeof adm.getApps === 'function' && adm.getApps().length) || (adm.apps && adm.apps.length);
      if (already){
        admin = adm;
        initialized = true;
        console.log('Firebase Admin already initialized; reusing existing app');
      } else {
        adm.initializeApp({ credential: adm.credential.cert(cred) });
        initialized = true;
        // store admin reference for other modules
        admin = adm;
        console.log('Firebase Admin initialized using service account');
      }
    }catch(e){
      // Handle a common race: another module initialized the default app between the
      // getApps() check and the call to initializeApp(). Treat that as success and
      // reuse the existing app instead of leaving the helper uninitialized.
      const msg = e && (e.message || String(e));
      if (msg && msg.toLowerCase().includes('already exists')){
        try{
          // Attempt to reuse the existing default app
          if (typeof adm.getApp === 'function'){
            try{ adm.getApp(); }catch(_){ /* ignore */ }
          }
          admin = adm;
          initialized = true;
          console.log('Firebase Admin already existed (race condition); reusing existing app');
        }catch(_e){
          console.error('Firebase Admin initialization failed and reuse attempt failed:', _e && (_e.message || _e));
        }
      } else {
        console.error('Firebase Admin initialization failed:', msg);
      }
    }
  } else {
    console.warn('Firebase Admin not initialized (no credentials found). Tried:', tried.join(', '));
  }
}

function verifyIdToken(idToken){
  const adm = tryRequireAdmin();
  if (!adm) return Promise.reject(new Error('firebase-admin package not installed'));
  initFirebaseAdmin();
  if (!initialized) return Promise.reject(new Error('Firebase admin not configured'));
  return adm.auth().verifyIdToken(idToken);
}

function getAdmin(){
  const adm = tryRequireAdmin();
  if (!adm) return null;
  if (!initialized) initFirebaseAdmin();
  return admin || null;
}

module.exports = { initFirebaseAdmin, verifyIdToken, getAdmin };

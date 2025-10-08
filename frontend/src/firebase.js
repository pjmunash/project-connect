// Firebase initialization
// Add this file to initialize Firebase services. Install the firebase SDK first:
// npm install firebase

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyAFc-B0R1mE1NxWtxWRYovB50sRBPToO1s",
  authDomain: "interbridge-cb648.firebaseapp.com",
  projectId: "interbridge-cb648",
  storageBucket: "interbridge-cb648.firebasestorage.app",
  messagingSenderId: "983897167461",
  appId: "1:983897167461:web:8508c92b29b3097581588c",
  measurementId: "G-BMGH20Y19R"
}

const app = initializeApp(firebaseConfig)
let analytics
try{ analytics = getAnalytics(app) }catch(e){ /* analytics may fail in some dev environments */ }
const auth = getAuth(app)

export { app, auth, analytics }

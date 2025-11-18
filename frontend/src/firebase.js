



import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'




const DEFAULT_PROJECT_ID = 'group-project-65d01'
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAFc-B0R1mE1NxWtxWRYovB50sRBPToO1s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${DEFAULT_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${DEFAULT_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "983897167461",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:983897167461:web:8508c92b29b3097581588c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BMGH20Y19R"
}

const app = initializeApp(firebaseConfig)
let analytics
try{ analytics = getAnalytics(app) }catch(e){  }
const auth = getAuth(app)



try{
  const useEmu = (import.meta.env.VITE_USE_FIREBASE_EMULATOR || '').toString().toLowerCase() === 'true'
  if (useEmu){
    
    connectAuthEmulator(auth, 'http://localhost:9099')
    console.log('Firebase: connected to Auth emulator at http://localhost:9099')
  }
}catch(e){  }

export { app, auth, analytics }

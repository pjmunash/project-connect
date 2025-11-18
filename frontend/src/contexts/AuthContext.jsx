import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, updateProfile, sendEmailVerification, onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext(null)

// Simple role store for dev: stored in localStorage under ROLE_MAP_KEY
const ROLE_MAP_KEY = 'opportunet_roles'
function saveRole(email, role){
  try{
    const raw = localStorage.getItem(ROLE_MAP_KEY) || '{}'
    const map = JSON.parse(raw)
    map[email] = role
    localStorage.setItem(ROLE_MAP_KEY, JSON.stringify(map))
  }catch(e){}
}
function loadRole(email){
  try{ const map = JSON.parse(localStorage.getItem(ROLE_MAP_KEY) || '{}'); return map[email] }catch(e){ return null }
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const firebaseMode = import.meta.env.VITE_USE_FIREBASE === 'true'

  // Debug: surface whether the app thinks it's in firebase mode
  console.debug('[AuthContext] firebaseMode=', firebaseMode)

  useEffect(()=>{
    if (firebaseMode){
      
      const unsub = onAuthStateChanged(auth, async (fuser)=>{
        if (fuser){
            const id = await fuser.getIdToken()
            
            try{
              const exchange = await api.post('/auth/firebase-exchange', { idToken: id, role: loadRole(fuser.email) })
              const backendToken = exchange.data.token
              const backendUser = exchange.data.user
              
              setToken(backendToken)
              localStorage.setItem('token', backendToken)
              api.setToken(backendToken)
              
              const roleFromBackend = backendUser?.role || loadRole(fuser.email) || 'student'
              setUser({ id: backendUser?.id || fuser.uid, email: fuser.email, name: fuser.displayName, role: roleFromBackend })
            }catch(e){
              
              setToken(id)
              localStorage.setItem('token', id)
              try{ api.setToken(id) }catch(e){}
              const role = loadRole(fuser.email) || 'student'
              setUser({ id: fuser.uid, email: fuser.email, name: fuser.displayName, role })
            }
        } else {
          setToken(null)
      	    localStorage.removeItem('token')
      	    try{ api.setToken(null) }catch(e){}
          setUser(null)
        }
      })
      return ()=> unsub()
    }

    if (token){
      localStorage.setItem('token', token)
      api.setToken(token)
      api.get('/auth/me').then(r=>{ setUser(r.data.user) }).catch(()=>{ setUser(null) })
    } else {
      localStorage.removeItem('token')
      api.setToken(null)
      setUser(null)
    }
  },[token])

  const login = async ({ email, password }) => {
    if (firebaseMode){
      console.debug('[AuthContext] login using Firebase')
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const fuser = cred.user
      const id = await fuser.getIdToken()
      setToken(id)
      const role = loadRole(fuser.email) || 'student'
      setUser({ id: fuser.uid, email: fuser.email, name: fuser.displayName, role })
      return { data: { token: id, user: { id: fuser.uid, email: fuser.email, name: fuser.displayName, role } } }
    }
    const res = await api.post('/auth/login', { email, password })
  setToken(res.data.token)
  
  api.setToken(res.data.token)
  localStorage.setItem('token', res.data.token)
  
  try{ setUser(res.data.user) }catch(e){}
  return res
  }

  
  const resendVerification = async ()=>{
    if (!firebaseMode) throw new Error('Not in firebase mode')
    try{
      if (!auth || !auth.currentUser) throw new Error('No active firebase user')
      await sendEmailVerification(auth.currentUser)
      return { ok: true }
    }catch(e){ return { ok: false, error: e.message || String(e) } }
  }

  
  const checkEmailVerified = async ()=>{
    if (!firebaseMode) return { verified: true }
    try{
      if (!auth || !auth.currentUser) return { verified: false }
      await auth.currentUser.reload()
      return { verified: !!auth.currentUser.emailVerified }
    }catch(e){ return { verified: false, error: e.message || String(e) } }
  }

  const signup = async ({ email, password, name, role }) => {
    if (firebaseMode){
      console.debug('[AuthContext] signup using Firebase')
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const fuser = cred.user
      try{ await updateProfile(fuser, { displayName: name }) }catch(e){}
      try{ await sendEmailVerification(fuser) }catch(e){}
      saveRole(email, role)
      const id = await fuser.getIdToken()
      setToken(id)
      setUser({ id: fuser.uid, email: fuser.email, name: name, role })
      return { data: { token: id, user: { id: fuser.uid, email: fuser.email, name, role } } }
    }
    try{
      const res = await api.post('/auth/signup', { email, password, name, role })
      setToken(res.data.token)
      api.setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      try{ setUser(res.data.user) }catch(e){}
      return res
    }catch(e){
      console.error('[AuthContext] backend signup error', e.response?.data || e.message || e)
      throw e
    }
  }

  const logout = async ()=>{
    if (firebaseMode){
      try{ await fbSignOut(auth) }catch(e){}
      setToken(null)
      setUser(null)
      return
    }
    setToken(null)
  }

  return <AuthContext.Provider value={{ user, token, login, signup, logout, setUser, firebaseMode, resendVerification, checkEmailVerified }}>{children}</AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}

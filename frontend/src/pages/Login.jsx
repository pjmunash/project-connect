import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SignInWithGoogle from '../components/SignInWithGoogle'
import { useEffect } from 'react'
import api from '../lib/api'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth as firebaseAuth } from '../firebase'

export default function Login({ defaultRole='', onSuccess }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const auth = useAuth()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const roleFromQuery = searchParams.get('role') || defaultRole

  useEffect(()=>{
    if (auth.user){
      const role = auth.user.role
      if (role === 'student') nav('/student')
      else if (role === 'employer') nav('/employer')
      else if (role === 'university') nav('/university')
      else nav('/')
    }
  },[auth.user])

  const submit = async (e)=>{
    e.preventDefault()
    try{
      const res = await auth.login({ email, password })
      const respUser = res.data?.user
      // call onSuccess if provided
      if (onSuccess) return onSuccess(respUser || { role: defaultRole })

      // otherwise redirect locally based on role
      const role = respUser?.role || defaultRole || (res.data?.token ? parseRoleFromToken(res.data.token) : null)
      if (role === 'student') nav('/student')
      else if (role === 'employer') nav('/employer')
      else if (role === 'university') nav('/university')
      else nav('/')
    }catch(err){ setError(err.response?.data?.message || 'Login failed') }
  }

  // Handle Google sign-in success: exchange firebase id token for backend JWT
  const handleGoogleSuccess = async (result) => {
    try{
      const fuser = result.user
      const idToken = await fuser.getIdToken()
      // exchange with backend for a JWT
      const exchange = await api.post('/auth/firebase-exchange', { idToken, role: roleFromQuery || '' })
      const backendToken = exchange.data.token
      const backendUser = exchange.data.user
      // persist token and set user in context
      localStorage.setItem('token', backendToken)
      api.setToken(backendToken)
      if (auth.setUser) auth.setUser(backendUser)
      // redirect based on role
      const role = backendUser?.role || roleFromQuery || 'student'
      if (role === 'student') nav('/student')
      else if (role === 'employer') nav('/employer')
      else if (role === 'university') nav('/university')
      else nav('/')
    }catch(err){
      setError(err.response?.data?.message || err.message || 'Google sign-in failed')
    }
  }

  // Forgot password flow (Firebase only)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')

  const sendReset = async () => {
    setResetMsg('')
    if (!auth.firebaseMode){ setResetMsg('Password reset is only available when using Firebase auth.'); return }
    try{
      await sendPasswordResetEmail(firebaseAuth, resetEmail || email)
      setResetMsg('Password reset email sent. Check your inbox.')
    }catch(e){
      setResetMsg(e?.message || 'Failed to send reset email')
    }
  }

  function parseRoleFromToken(token){
    try{
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payload = JSON.parse(atob(parts[1]))
      return payload.user?.role || payload.role || null
    }catch(e){ return null }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="neo-card p-6">
        <h2 className="text-xl font-semibold">Login</h2>
        {error && <div className="bg-red-900/40 text-red-200 p-2 my-2">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="neo-input w-full" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="neo-input w-full" />
          <div className="flex gap-2 items-center">
            <button className="neo-btn w-full">Login</button>
            <button type="button" className="ml-2 text-sm text-sky-300 underline" onClick={()=>setShowReset(s=>!s)}>Forgot?</button>
          </div>
        </form>
        {showReset && (
          <div className="mt-3 p-3 bg-slate-900 rounded">
            <div className="text-sm mb-2">Enter your email to receive a password reset link:</div>
            <input value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="Email for reset" className="neo-input w-full mb-2" />
            <div className="flex gap-2">
              <button className="neo-btn" onClick={sendReset}>Send reset</button>
              <button className="neo-btn bg-gray-600" onClick={()=>setShowReset(false)}>Cancel</button>
            </div>
            {resetMsg && <div className="mt-2 text-sm text-slate-200">{resetMsg}</div>}
          </div>
        )}
        <div className="mt-3">
          <SignInWithGoogle onSuccess={handleGoogleSuccess} onError={(e)=>setError('Google sign-in failed')} role={roleFromQuery || ''} />
        </div>
      </div>
    </div>
  )
}

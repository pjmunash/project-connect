import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { auth as firebaseAuth } from '../firebase'
import { sendEmailVerification, reload } from 'firebase/auth'
import SignInWithGoogle from '../components/SignInWithGoogle'

export default function Signup({ defaultRole='', onSuccess }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')
  const auth = useAuth()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  // If auth.user becomes available (e.g. after Google sign-in and backend exchange), navigate to appropriate dashboard
  useEffect(()=>{
    if (auth.user && !verificationSent){
      const roleResolved = auth.user.role || role
      if (roleResolved === 'student') nav('/student')
      else if (roleResolved === 'employer') nav('/employer')
      else if (roleResolved === 'university') nav('/university')
      else nav('/')
    }
  },[auth.user, verificationSent])

  useEffect(()=>{
    const r = searchParams.get('role')
    if (r) setRole(r)
    if (defaultRole) setRole(defaultRole)
  },[searchParams])

  const submit = async (e)=>{
    e.preventDefault()
    try{
      const res = await auth.signup({ email, password, name, role })
      const respUser = res.data?.user || { role }
      if (onSuccess) return onSuccess(respUser)

      // If running in Firebase mode the signup has sent a verification email.
      // Show a confirmation screen and allow resending / checking verification.
      if (auth.firebaseMode){
        setVerificationSent(true)
        setVerifyMessage(`A verification link was sent to ${email}. Please check your inbox.`)
        return
      }

      // navigate based on role
      if (respUser.role === 'student') nav('/student')
      else if (respUser.role === 'employer') nav('/employer')
      else if (respUser.role === 'university') nav('/university')
      else nav('/')
    }catch(err){ setError(err.response?.data?.message || 'Signup failed') }
  }

  const handleResend = async ()=>{
    setVerifyMessage('')
    try{
      if (firebaseAuth.currentUser){
        await sendEmailVerification(firebaseAuth.currentUser)
        setVerifyMessage('Verification email resent. Check your inbox.')
      } else {
        setVerifyMessage('No active user session to resend verification. Try signing in first.')
      }
    }catch(e){ setVerifyMessage('Failed to resend verification email') }
  }

  const handleIHaveVerified = async ()=>{
    setVerifyMessage('Checking verification...')
    try{
      if (!firebaseAuth.currentUser) return setVerifyMessage('No active session. Please sign in and try again.')
      await reload(firebaseAuth.currentUser)
      if (firebaseAuth.currentUser.emailVerified){
        // force refresh token so backend sees updated claim if needed
        try{ await firebaseAuth.currentUser.getIdToken(true) }catch(e){}
        // navigate based on role we collected earlier
        if (role === 'student') nav('/student')
        else if (role === 'employer') nav('/employer')
        else if (role === 'university') nav('/university')
        else nav('/')
      } else {
        setVerifyMessage('Email not verified yet. Please check the link in your email.')
      }
    }catch(e){ setVerifyMessage('Error while checking verification. Try again.') }
  }

  if (verificationSent){
    return (
      <div className="max-w-lg mx-auto">
        <div className="neo-card p-6">
          <h2 className="text-2xl font-semibold">Verify your email</h2>
          <p className="text-sm muted mt-2">{verifyMessage}</p>
          {verifyMessage && <div className="text-sm muted mt-2">{verifyMessage}</div>}
          <div className="mt-4 space-x-2">
            <button onClick={handleResend} className="neo-btn">Resend verification</button>
            <button onClick={handleIHaveVerified} className="neo-btn">I have verified</button>
          </div>
          <div className="text-sm muted mt-4">If you don't see the email, check spam or try resending.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="neo-card p-6">
        <h2 className="text-2xl font-semibold">Create your account</h2>
        <p className="text-sm muted mt-1">Role: <strong className="capitalize">{role}</strong></p>
        {error && <div className="bg-red-900/40 text-red-200 p-2 my-2">{error}</div>}
        <form onSubmit={submit} className="space-y-3 mt-4">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="neo-input w-full" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="neo-input w-full" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="neo-input w-full" />
          <div>
            <label className="block text-sm muted mb-1">Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} className="neo-input w-full">
              <option value="student">Student</option>
              <option value="employer">Employer</option>
              <option value="university">University</option>
            </select>
          </div>
          <button className="neo-btn w-full">Create account</button>
        </form>
    <div className="mt-4">
      <SignInWithGoogle onSuccess={()=>{ /* onAuthStateChanged will handle navigation */ }} onError={()=>{}} label="Sign up with Google" role={role} />
    </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function VerifyEmailNotice(){
  const { user, firebaseMode, resendVerification, checkEmailVerified } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!firebaseMode || !user || dismissed) return null

  const handleResend = async ()=>{
    setLoading(true)
    setMessage('')
    const res = await resendVerification()
    setLoading(false)
    if (res.ok) setMessage('Verification email sent. Check your inbox.')
    else setMessage(res.error || 'Failed to send verification email')
  }

  const handleCheck = async ()=>{
    setLoading(true)
    setMessage('')
    const r = await checkEmailVerified()
    setLoading(false)
    if (r.verified) setMessage('Email is verified — thank you!')
    else setMessage('Email not verified yet. Check your inbox or resend the link.')
  }

  return (
    <div className="neo-card mb-4">
      <div className="flex items-center justify-between">
        <div>
          <strong className="block">Verify your email</strong>
          <div className="text-sm muted">We sent a verification link to <strong>{user.email}</strong>. You must verify to access some features.</div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheck} disabled={loading} className="neo-btn">Check</button>
          <button onClick={handleResend} disabled={loading} className="neo-ghost">Resend</button>
          <button onClick={()=>setDismissed(true)} className="neo-ghost">Close</button>
        </div>
      </div>
      {message && <div className="mt-2 text-sm muted">{message}</div>}
    </div>
  )
}

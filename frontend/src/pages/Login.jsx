import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SignInWithGoogle from '../components/SignInWithGoogle'
import { useEffect } from 'react'

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
          <button className="neo-btn w-full">Login</button>
        </form>
        <div className="mt-3">
          <SignInWithGoogle onSuccess={()=>{ /* AuthContext onAuthStateChanged will exchange and set user; navigation handled by effect above */ }} onError={(e)=>setError('Google sign-in failed')} role={roleFromQuery || ''} />
        </div>
      </div>
    </div>
  )
}

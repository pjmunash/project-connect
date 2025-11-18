import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Login from './Login'
import Signup from './Signup'

export default function AuthGate(){
  const [tab, setTab] = useState('login')
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || ''
  const nav = useNavigate()

  
  const onAuthSuccess = (user)=>{
    
    const chosenRole = role || user?.role
    if (chosenRole === 'student') nav('/student')
    else if (chosenRole === 'employer') nav('/employer')
    else if (chosenRole === 'university') nav('/university')
    else nav('/')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="neo-card p-6">
        <div className="flex gap-2 mb-4">
          <button onClick={()=>setTab('login')} className={`px-4 py-2 rounded ${tab==='login'?'neo-btn':'neo-ghost'}`}>Login</button>
          <button onClick={()=>setTab('signup')} className={`px-4 py-2 rounded ${tab==='signup'?'neo-btn':'neo-ghost'}`}>Sign up</button>
        </div>

        <div>
          {tab === 'login' ? <Login defaultRole={role} onSuccess={onAuthSuccess}/> : <Signup defaultRole={role} onSuccess={onAuthSuccess}/>}
        </div>
      </div>
    </div>
  )
}

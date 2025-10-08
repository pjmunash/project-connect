import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ApiStatus from './ApiStatus'
import IconLogo from './IconLogo'
import { useState, useEffect } from 'react'
import api from '../lib/api'

export default function Navbar(){
  const { user, logout } = useAuth()
  const [applicantCount, setApplicantCount] = useState(0)

  useEffect(()=>{
    let mounted = true
    async function load(){
      if (!user || user.role !== 'employer') return
      try{
        const res = await api.get('/internships')
        const items = res.data.items || []
        const mine = items.filter(it=> String(it.postedBy?._id || it.postedBy) === String(user?.id) || it.postedBy?.email === user?.email)
        const count = mine.reduce((s,i)=> s + ((i.applicants && i.applicants.length) || 0), 0)
        if (mounted) setApplicantCount(count)
      }catch(e){ if (mounted) setApplicantCount(0) }
    }
    load()
    const t = setInterval(load, 15_000)
    return ()=>{ mounted = false; clearInterval(t) }
  },[user])
  return (
    <header className="neo-card relative z-40 w-full">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <IconLogo />
            <span className="text-2xl font-bold" style={{ background: 'linear-gradient(90deg, #7A3CFF, #4B6BFF)', WebkitBackgroundClip:'text', color:'transparent' }}>OpportuNet</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 muted text-sm">
            <Link to="/student" className="hover:text-cyan-300">Student</Link>
            <Link to="/employer" className="hover:text-cyan-300">Employer</Link>
            <Link to="/university" className="hover:text-cyan-300">University</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ApiStatus />
          {user && user.role === 'employer' && (
            <div className="relative muted text-sm">
              <Link to="/employer">Dashboard</Link>
              {applicantCount > 0 && <span className="absolute -top-2 -right-4 bg-[#ff6b6b] text-white rounded-full text-xs px-2">{applicantCount}</span>}
            </div>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-sm muted hidden sm:block">{user.name || user.email}</div>
              <button onClick={logout} className="neo-ghost">Logout</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="neo-ghost">Login</Link>
              <Link to="/signup" className="neo-btn">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

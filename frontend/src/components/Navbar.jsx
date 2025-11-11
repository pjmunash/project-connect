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
  const [open, setOpen] = useState(false)

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
      <div className="container mx-auto p-4 flex flex-wrap justify-between items-center gap-3">
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

        {}
        <div className="flex items-center gap-4">
          <ApiStatus />
          {user && user.role === 'employer' && (
            <div className="relative muted text-sm hidden sm:block">
              <Link to="/employer">Dashboard</Link>
              {applicantCount > 0 && <span className="absolute -top-2 -right-4 bg-[#ff6b6b] text-white rounded-full text-xs px-2">{applicantCount}</span>}
            </div>
          )}

          {}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                <div className="text-sm muted">{user.name || user.email}</div>
                <button onClick={logout} className="neo-ghost">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="neo-ghost">Login</Link>
                <Link to="/signup" className="neo-btn">Sign up</Link>
              </>
            )}
          </div>

          {}
          <button onClick={()=>setOpen(o=>!o)} className="md:hidden p-2 rounded-md neo-ghost">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
          </button>
        </div>

        {}
        {open && (
          <div className="w-full mt-3 md:hidden">
            <nav className="flex flex-col gap-2 muted text-sm neo-card">
              <Link to="/student" onClick={()=>setOpen(false)} className="px-3 py-2 hover:text-cyan-300">Student</Link>
              <Link to="/employer" onClick={()=>setOpen(false)} className="px-3 py-2 hover:text-cyan-300">Employer</Link>
              <Link to="/university" onClick={()=>setOpen(false)} className="px-3 py-2 hover:text-cyan-300">University</Link>
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="text-sm muted px-3">{user.name || user.email}</div>
                    <button onClick={()=>{ setOpen(false); logout(); }} className="neo-ghost m-3">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={()=>setOpen(false)} className="neo-ghost m-3">Login</Link>
                    <Link to="/signup" onClick={()=>setOpen(false)} className="neo-btn m-3">Sign up</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

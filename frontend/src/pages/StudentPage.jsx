import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import InternshipCard from '../components/InternshipCard'
import api from '../lib/api'

export default function StudentPage(){
  const { user } = useAuth()
  const [profile, setProfile] = useState(user?.profile || { skills: [], education: [], projects: [] })
  const [internships, setInternships] = useState([])
  const [applications, setApplications] = useState([])
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUrl, setResumeUrl] = useState('')

  useEffect(()=>{
    let mounted = true
    api.get('/internships')
      .then(r => { if (mounted) setInternships(r.data.items || []) })
      .catch(() => { if (mounted) setInternships([]) })

    if (user){
      // Try to load the user's profile/applications from the backend if available
      api.get('/users/me').then(r => {
        if (!mounted) return
        const u = r.data.user || {}
        setProfile(u.profile || profile)
        setApplications(u.applications || [])
      }).catch(()=>{})
    }

    return ()=> mounted = false
  }, [user])

  return (
    <div className="space-y-6">
      <section className="neo-card p-8">
        <h1 className="text-3xl font-bold">Students — Build a career-ready profile</h1>
        <p className="mt-2 muted">Create a detailed profile, generate AI resumes, practice interviews and apply to verified internships.</p>
        <div className="mt-4 flex gap-3">
          <Link to="/signup?role=student" className="px-4 py-2 neo-btn">Create profile</Link>
          <Link to="/login" className="px-4 py-2 neo-ghost">Login</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neo-card p-4">
          <h3 className="font-semibold">AI Resume Generator</h3>
          <p className="text-sm muted">Auto-generate resumes from your profile and download them as PDF.</p>
        </div>
        <div className="neo-card p-4">
          <h3 className="font-semibold">Interview Prep Bot</h3>
          <p className="text-sm muted">Practice with AI-powered Q&A and get feedback on answers.</p>
        </div>
        <div className="neo-card p-4">
          <h3 className="font-semibold">Application Tracker</h3>
          <p className="text-sm muted">Track applied, reviewed, accepted and rejected statuses in one place.</p>
        </div>
      </section>
    </div>
  )
}

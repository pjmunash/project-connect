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
    api.get('/internships').then(r=>{ if (mounted) setInternships(r.data.items || []) }).catch(()=>{ if (mounted) setInternships([]) })
    if (user){
      // load this student's applications
      api.get('/internships/student/applications').then(r=> setApplications(r.data.applications || [])).catch(()=>setApplications([]))
      // load profile from backend if available
      api.get('/users/me/profile').then(r=>{
        const p = r.data.profile || {}
        setProfile({ skills: p.skills || [], education: p.education || [], projects: p.projects || [] })
      }).catch(()=>{})
    }
    return ()=> mounted = false
  },[user])

  const saveProfile = ()=>{
    // persist profile to backend
    api.post('/users/me/profile', { profile }).then(()=> alert('Profile saved')).catch(()=> alert('Save failed'))
  }

  const apply = (job) =>{
    if (!user) return alert('Please sign in to apply')
    // include additional profile details when applying and form answers if any
    const payload = { resumeUrl, message: '', university: profile.university || '', degree: profile.degree || '', major: profile.major || '', currentYear: profile.currentYear || '', skills: profile.skills || [], formAnswers: profile.formAnswers || {} }
    api.post(`/internships/${job._id || job.id}/apply`, payload).then(()=>{
      alert('Applied')
      // refresh applications from server
      api.get('/internships/student/applications').then(r=> setApplications(r.data.applications || [])).catch(()=>{})
    }).catch(err=>{
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to apply (server error or unreachable)'
      console.error('Apply failed', err)
      alert(msg)
    })
  }

  const addProject = ()=>{
    setProfile(prev=>({ ...prev, projects: [...(prev.projects||[]), { title:'', link:'', description:'' }] }))
  }

  const onUpload = async ()=>{
    if (!resumeFile) return alert('Choose a file')
    const form = new FormData(); form.append('resume', resumeFile)
    try{
      const res = await api.post('/uploads/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResumeUrl(res.data.url)
      alert('Uploaded')
    }catch(e){ alert('Upload failed') }
  }

  // If the user is signed in and a student, show dashboard UI
  if (user && user.role === 'student'){
    return (
      <div className="space-y-6">
        <div className="neo-card p-6">
          <h2 className="text-2xl font-bold">Welcome back, {user?.name || 'Student'}</h2>
          <p className="mt-2 muted">Build your profile, generate a professional resume, and apply to internships that match your skills.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="neo-card p-4">
            <h3 className="font-semibold">My Profile</h3>
            <div className="mt-2">
              <label className="text-sm muted">Skills (comma separated)</label>
              <input value={profile.skills.join(', ')} onChange={e=>setProfile({...profile, skills: e.target.value.split(',').map(s=>s.trim())})} className="neo-input w-full mt-1" />
              <button onClick={saveProfile} className="neo-btn mt-2">Save</button>
              <div className="mt-4">
                <label className="text-sm muted">Upload resume</label>
                <input type="file" onChange={e=>setResumeFile(e.target.files && e.target.files[0])} className="block mt-2" />
                <div className="mt-2 flex gap-2">
                  <button onClick={onUpload} className="neo-btn">Upload</button>
                  {resumeUrl && <a className="neo-ghost" target="_blank" rel="noreferrer" href={api.absoluteUrl(resumeUrl)}>View resume</a>}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Projects</h4>
                <div className="space-y-2 mt-2">
                  {(profile.projects || []).map((p, idx) => (
                    <div key={idx} className="neo-card p-2">
                      <input value={p.title} onChange={e=>{ const copy = [...profile.projects]; copy[idx].title = e.target.value; setProfile({...profile, projects: copy}) }} placeholder="Title" className="neo-input w-full" />
                      <input value={p.link} onChange={e=>{ const copy = [...profile.projects]; copy[idx].link = e.target.value; setProfile({...profile, projects: copy}) }} placeholder="Link (GitHub)" className="neo-input w-full mt-1" />
                      <textarea value={p.description} onChange={e=>{ const copy = [...profile.projects]; copy[idx].description = e.target.value; setProfile({...profile, projects: copy}) }} placeholder="Short description" className="neo-input w-full mt-1" />
                    </div>
                  ))}
                  <div className="mt-2"><button onClick={addProject} className="neo-ghost">Add project</button></div>
                </div>
              </div>
            </div>
          </div>

          <div className="neo-card col-span-2 p-4">
            <h3 className="font-semibold">Internships</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {internships.map(job=> <InternshipCard key={job._id || job.id} job={job} onApply={apply} isApplied={applications.some(a=>a.internshipId===(job._id || job.id))} />)}
            </div>
          </div>
        </div>

        <div className="neo-card p-4">
          <h3 className="font-semibold">My Applications</h3>
          <ul className="mt-2">
            {applications.length === 0 && <li className="text-sm muted">No applications yet</li>}
            {applications.map(a=> <li key={a.internshipId} className="py-1">{a.internshipId} — {a.status}</li>)}
          </ul>
        </div>
      </div>
    )
  }

  // Otherwise show landing marketing content
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

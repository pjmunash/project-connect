import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import VerifyEmailNotice from '../components/VerifyEmailNotice'
import api from '../lib/api'

export default function UniversityPage(){
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [applications, setApplications] = useState([])
  const [bulkText, setBulkText] = useState('')
  const [bulkDomain, setBulkDomain] = useState('')
  const [bulkResults, setBulkResults] = useState(null)
  const [loadingBulk, setLoadingBulk] = useState(false)
  const [revealedEmails, setRevealedEmails] = useState(new Set())

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{ const res = await api.get('/university/students'); if (mounted) setStudents(res.data.students || []) }catch(e){}
    }
    load()
    return ()=> mounted = false
  }, [])

  const check = async ()=>{
    try{
      const found = students.find(s => s.email?.toLowerCase() === (email||'').toLowerCase())
      if (found) { setVerified(!!found.verified); setRevealedEmails(prev=>{const n=new Set(prev); n.add(found.email); return n}); return }
      const res = await api.get(`/university/students?q=${encodeURIComponent(email)}`)
      const s = (res.data.students || [])[0]
      setVerified(s ? !!s.verified : null)
      if (s) setRevealedEmails(prev=>{const n=new Set(prev); n.add(s.email); return n})
    }catch(err){ setVerified(null); alert('Check failed') }
  }

  const toggle = async ()=>{
    try{
      const s = students.find(s => s.email.toLowerCase() === (email||'').toLowerCase())
      let id = s ? s._id : null
      if (!id){ const res = await api.get(`/university/students?q=${encodeURIComponent(email)}`); id = (res.data.students && res.data.students[0] && res.data.students[0]._id) || null }
      if (!id) return alert('Student not found')
      const cur = students.find(x=>x._id===id)?.verified
      await api.post(`/university/students/${id}/verify`, { verified: !cur })
      const res2 = await api.get('/university/students'); setStudents(res2.data.students || [])
      setVerified(prev => prev === null ? null : !prev)
    }catch(err){ console.error(err); alert('Toggle failed') }
  }

  const submitBulk = async ()=>{
    const emails = bulkText.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean)
    if (emails.length === 0 && !bulkDomain) return alert('Paste emails or enter a domain')
    setLoadingBulk(true); setBulkResults(null)
    try{ const payload = emails.length ? { emails } : { domain: bulkDomain }; const res = await api.post('/university/students/bulk', payload); setBulkResults(res.data) }
    catch(err){ console.error('Bulk lookup failed', err); alert('Bulk lookup failed') }finally{ setLoadingBulk(false) }
  }

  const viewApplications = async (student)=>{
    if (!student || !student.email) return
    setRevealedEmails(prev => { const n = new Set(prev); n.add(student.email); return n })
    setSelectedStudent(student)
    try{ const res = await api.get(`/internships/student/applications?email=${encodeURIComponent(student.email)}`); setApplications(res.data.applications || []) }
    catch(err){ console.error('Failed to load student applications', err); alert('Failed to load applications'); setApplications([]) }
  }

  const maskEmail = (e)=>{ if (!e) return ''; if (revealedEmails && revealedEmails.has && revealedEmails.has(e)) return e; const parts = e.split('@'); if (parts.length !== 2) return '***'; return parts[0][0] + '****@' + parts[1] }

  
  if (selectedStudent){
    const prof = selectedStudent.profile || {}
    const skills = (prof.skills || []).join(', ')
    return (
      <div className="neo-card p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">Applications for {selectedStudent.email}</h3>
            <div className="text-sm muted">Name: {selectedStudent.name || '—'} • Verified: {selectedStudent.verified ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <button onClick={()=>{ setSelectedStudent(null); setApplications([]) }} className="neo-ghost mt-2">Close</button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 neo-card p-3">
            <h4 className="font-semibold">Student profile</h4>
            <div className="text-sm mt-2"><strong>Skills</strong>: {skills || 'None'}</div>
            <div className="text-sm mt-2"><strong>Education</strong>:</div>
            <ul className="text-sm list-disc ml-5">
              {(prof.education || []).slice(0,3).map((e,i)=> <li key={i}>{e.degree || ''} @ {e.institution || ''} {e.year? `(${e.year})`:''}</li>)}
              {(prof.education || []).length === 0 && <li className="text-sm muted">No education listed</li>}
            </ul>
            <div className="text-sm mt-2"><strong>Projects</strong>: {(prof.projects || []).length || 0}</div>
          </div>

          <div className="col-span-2 neo-card p-3">
            <h4 className="font-semibold">Applications</h4>
            <ul className="mt-2 space-y-4">
              {applications.length === 0 && <li className="text-sm muted">No applications found</li>}
              {applications.map(a=> {
                const applicantUser = a.applicant && a.applicant.user ? a.applicant.user : selectedStudent
                const emailToShow = applicantUser?.email ? (revealedEmails && revealedEmails.has && revealedEmails.has(applicantUser.email) ? applicantUser.email : maskEmail(applicantUser.email)) : '—'
                return (
                  <li key={a.internshipId} className="py-3 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm muted">{emailToShow} — {applicantUser?.verified ? 'Verified' : 'Unverified'}</div>
                        <div className="font-medium">{a.title} — {a.company}</div>
                        <div className="text-sm muted">Status: <strong>{a.applicant?.status || 'applied'}</strong></div>
                        <div className="text-sm muted">Applied: {a.applicant?.appliedAt ? new Date(a.applicant.appliedAt).toLocaleString() : '—'}</div>
                        {a.applicant?.message && <div className="text-sm mt-1">Message: {a.applicant.message}</div>}
                      </div>
                      <div className="text-right flex flex-col justify-center items-end gap-2">
                        {a.applicant?.resumeUrl && <a className="inline-block text-sm" style={{color:'var(--cyan)'}} target="_blank" rel="noreferrer" href={api.absoluteUrl(a.applicant.resumeUrl)}>View resume</a>}
                        <div className="flex gap-2">
                          <button className="neo-ghost px-3 py-1" disabled>Mark placed</button>
                          <button className="neo-ghost px-3 py-1" disabled>Notes</button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  
  if (user && user.role === 'university'){
    return (
      <div className="space-y-6">
        <VerifyEmailNotice />
        <div className="neo-card p-6">
          <h2 className="text-2xl font-bold">University Dashboard</h2>
          <p className="mt-2 muted">Verify student accounts, monitor placement progress, and export reports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="neo-card p-4">
            <h3 className="font-semibold">Verify Students</h3>
            <div className="mt-2">
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="student email" className="neo-input w-full" />
              <div className="mt-2 flex gap-2">
                <button onClick={check} className="neo-btn">Check</button>
                <button onClick={toggle} className="neo-ghost">Toggle verified</button>
              </div>
              {verified !== null && <div className="mt-2 text-sm">Verified: {verified ? 'Yes' : 'No'}</div>}

              <div className="mt-4">
                <h4 className="font-semibold">Recent students</h4>
                <ul className="text-sm mt-2">
                  {students.slice(0,8).map(s=> (
                    <li key={s._id} className="py-1 border-b flex justify-between items-center">
                      <div>{maskEmail(s.email)} — {s.verified? 'Verified':'Unverified'}</div>
                      <div className="flex gap-2">
                        <button onClick={()=>viewApplications(s)} className="neo-btn text-sm">View applications</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="neo-card p-4 col-span-2">
            <h3 className="font-semibold">Reports</h3>
            <p className="text-sm muted mt-2">Export placement statistics and generate CSV reports (mock).</p>
            <div className="mt-4">
              <h4 className="font-semibold">Bulk university emails</h4>
              <p className="text-sm muted">Paste a list of student emails (one per line) or enter a domain to fetch aggregated placement stats.</p>
              <textarea className="neo-input w-full mt-2" rows={4} value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="one@email.com per line, or leave blank and provide a domain" />
              <div className="mt-2 flex gap-2">
                <input className="neo-input" placeholder="domain (e.g. kabarak.ac.ke)" value={bulkDomain} onChange={e=>setBulkDomain(e.target.value)} />
                <button onClick={submitBulk} disabled={loadingBulk} className="neo-btn">{loadingBulk? 'Loading...':'Lookup'}</button>
              </div>

              {bulkResults && (
                <div className="mt-3 p-3 neo-card">
                  <div className="text-sm font-medium">Stats</div>
                  <div className="text-sm mt-1">Students: {bulkResults.stats.students} • Applications: {bulkResults.stats.totalApplications} • Accepted: {bulkResults.stats.totalAccepted}</div>
                  <div className="mt-3">
                    <h5 className="font-semibold">Students</h5>
                    <ul className="mt-2">
                      {bulkResults.results.map(r=> (
                        <li key={r.user.email} className="py-2 border-b">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{r.user.name || r.user.email}</div>
                              <div className="text-sm muted">Email: {r.user.email} • Verified: {r.user.verified ? 'Yes' : 'No'}</div>
                              <div className="text-sm">Applications: {r.counts.total} • Accepted: {r.counts.accepted}</div>
                            </div>
                            <div>
                              <button onClick={()=>viewApplications(r.user)} className="neo-btn text-sm">View</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  
  return (
    <div className="space-y-6">
      <section className="neo-card p-8">
        <h1 className="text-3xl font-bold">Universities — Track and verify placements</h1>
        <p className="mt-2 muted">Verify student credentials, monitor application progress and generate placement reports for stakeholders.</p>
        <div className="mt-4 flex gap-3">
          <Link to="/signup?role=university" className="px-4 py-2 neo-btn">Create university account</Link>
          <Link to="/login" className="px-4 py-2 neo-ghost">Login</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neo-card p-4">
          <h3 className="font-semibold">Verification Tools</h3>
          <p className="text-sm muted">Quickly verify student enrollment and credential uploads with an approval workflow.</p>
        </div>
        <div className="neo-card p-4">
          <h3 className="font-semibold">Placement Monitoring</h3>
          <p className="text-sm muted">Monitor student applications and accepted offers across programs and companies.</p>
        </div>
        <div className="neo-card p-4">
          <h3 className="font-semibold">Reports & Exports</h3>
          <p className="text-sm muted">Generate CSV/PDF reports for placements, employer engagement and student outcomes.</p>
        </div>
      </section>
    </div>
  )
}

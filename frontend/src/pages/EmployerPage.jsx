import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

function StatusChip({ status }){
  const map = {
    applied: { label: 'Applied', cls: 'neo-chip-muted' },
    pending: { label: 'Pending', cls: 'neo-chip-warning' },
    accepted: { label: 'Accepted', cls: 'neo-chip-accept' },
    rejected: { label: 'Rejected', cls: 'neo-chip-reject' }
  }
  const s = map[status] || { label: status || 'Unknown', cls: 'neo-chip-muted' }
  return <span className={`px-2 py-1 rounded text-xs ${s.cls}`}>{s.label}</span>
}

export default function EmployerPage(){
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [selected, setSelected] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [applicantsError, setApplicantsError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [form, setForm] = useState({ title: '', company: user?.name || '', field: '', location: '', remote: false, paid: false, description: '', requirements: '', duration: '', stipend: '', deadline: '' })
  const [editingId, setEditingId] = useState(null)
  const [notifications, setNotifications] = useState(0)

  useEffect(()=>{
    let mounted = true
    async function load(){
      try{
        const r = await api.get('/internships')
        if (!mounted) return
        const items = r.data.items || []
        const mine = items.filter(it=> String(it.postedBy?._id || it.postedBy) === String(user?.id) || it.postedBy?.email === user?.email)
        setPosts(mine)
      }catch(e){ setPosts([]) }
    }
    load()
    return ()=> mounted = false
  },[user])

  // simple polling for new applicants count to show a notification badge
  useEffect(()=>{
    let mounted = true
    let timer = null
    async function poll(){
      if (!user || user.role !== 'employer') return
      try{
        const r = await api.get('/internships')
        if (!mounted) return
        const mine = (r.data.items || []).filter(it=> String(it.postedBy?._id || it.postedBy) === String(user?.id) || it.postedBy?.email === user?.email)
        const totalNew = mine.reduce((acc,i)=> acc + ((i.applicants||[]).filter(a=> a.status === 'applied').length), 0)
        setNotifications(totalNew)
      }catch(e){ /* ignore */ }
      timer = setTimeout(poll, 15000)
    }
    poll()
    return ()=>{ mounted = false; if (timer) clearTimeout(timer) }
  },[user])

  const viewApplicants = async (post)=>{
    setSelected(post)
    setApplicants([])
    setApplicantsError(null)
    setLoadingApplicants(true)
    try{
      const res = await api.get(`/internships/${post._id}/applicants`)
      // normalize resume urls
      const apps = (res.data.applicants || []).map(a => ({ ...a, resumeUrl: api.absoluteUrl(a.resumeUrl) }))
      setApplicants(apps)
    }catch(e){
      console.error('Failed to load applicants', e)
      setApplicantsError(e.response?.data?.message || e.message || 'Failed to load applicants')
    }finally{ setLoadingApplicants(false) }
  }

  const updateStatus = async (post, app, status)=>{
    try{
      await api.post(`/internships/${post._id}/applicants/${app._id}/status`, { status })
      const res = await api.get(`/internships/${post._id}/applicants`)
      const apps = (res.data.applicants || []).map(a => ({ ...a, resumeUrl: api.absoluteUrl(a.resumeUrl) }))
      setApplicants(apps)
    }catch(e){
      console.error('Status update failed', e)
      const msg = e.response?.data?.message || e.response?.data?.detail || e.message || 'Update failed'
      alert('Update failed: ' + msg)
    }
  }

  const submit = async (e)=>{
    e.preventDefault()
    try{
      if (editingId){
        const res = await api.put(`/internships/${editingId}`, { ...form })
        setPosts(prev=> prev.map(p=> p._id === editingId ? res.data.internship : p))
        setEditingId(null)
      } else {
        const res = await api.post('/internships', { ...form })
        setPosts(prev=>[...(prev||[]), res.data.internship])
      }
      setForm({ title:'', company: user?.name || '', field:'', location:'', remote:false, paid:false, description:'', requirements:'', duration:'', stipend:'', deadline:'' })
    }catch(err){
      alert(err.response?.data?.message || 'Failed to post. Are you authorized?')
    }
  }

  const startEdit = (p) =>{
    setEditingId(p._id)
    setForm({ title: p.title || '', company: p.company || user?.name || '', field: p.field || '', location: p.location || '', remote: !!p.remote, paid: !!p.paid, description: p.description || '', requirements: p.requirements || '', duration: p.duration || '', stipend: p.stipend || '', deadline: p.deadline || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const removePost = async (p)=>{
    if (!confirm('Delete this posting?')) return
    try{
      await api.delete(`/internships/${p._id}`)
      setPosts(prev=> prev.filter(x=> x._id !== p._id))
    }catch(e){ alert('Delete failed') }
  }

  const filteredApplicants = applicants.filter(a => {
    if (!a) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchText){
      const q = searchText.toLowerCase();
      const name = (a.user?.name || '').toLowerCase();
      const email = (a.user?.email || '').toLowerCase();
      const msg = (a.message || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !msg.includes(q)) return false;
    }
    return true;
  })

  const exportApplicants = async ()=>{
    try{
      const rows = filteredApplicants.map(a=>({ name: a.user?.name || '', email: a.user?.email || '', status: a.status, appliedAt: a.appliedAt, resumeUrl: a.resumeUrl }))
      if (!rows || rows.length === 0) return alert('No applicants to export')
      const { exportCsv } = await import('../lib/csv');
      exportCsv(`applicants-${selected?._id || 'list'}.csv`, rows)
    }catch(e){ console.error('Export failed', e); alert('Export failed: ' + (e?.message || 'unknown')) }
  }

  // simple applicants panel — render this first when a posting is selected
  if (selected){
    return (
      <div className="neo-card p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Applicants for {selected.title}</h3>
          <div>
            <button onClick={()=>{ setSelected(null); setApplicants([]) }} className="neo-ghost">Close</button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 items-center">
          <label className="text-sm muted">Filter:</label>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="neo-input">
            <option value="all">All</option>
            <option value="applied">Applied</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <input placeholder="search name/email/message" value={searchText} onChange={e=>setSearchText(e.target.value)} className="neo-input flex-1" />
        </div>
        <div className="mt-4 space-y-3">
          {loadingApplicants && <div className="text-sm muted">Loading applicants...</div>}
          {applicantsError && <div className="text-sm text-red-500">Error: {applicantsError}</div>}
          {!loadingApplicants && !applicantsError && applicants.length === 0 && <div className="text-sm muted">No applicants yet</div>}
          {filteredApplicants.map(a=> (
            <div key={a._id} className="neo-card p-3">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-lg">{a.user?.name || a.user?.email}</div>
                    <div className="text-sm muted">{a.user?.profile?.university || a.university || ''}</div>
                  </div>
                  <div className="text-sm muted">Applied: {a.appliedAt ? new Date(a.appliedAt).toLocaleString() : '—'}</div>
                  {a.degree || a.major || a.currentYear ? (
                    <div className="mt-2 text-sm muted">{[a.degree, a.major, a.currentYear].filter(Boolean).join(' • ')}</div>
                  ) : null}
                  {a.skills && a.skills.length > 0 && (
                    <div className="mt-2 text-xs">
                      {a.skills.map((s,idx)=> <span key={idx} className="inline-block bg-[rgba(255,255,255,0.04)] text-xs px-2 py-1 rounded mr-2">{s}</span>)}
                    </div>
                  )}
                  {a.message && <div className="mt-2 text-sm">Message: {a.message}</div>}
                </div>
                <div className="w-56 text-right">
                  {a.resumeUrl ? <a className="inline-block text-sm text-cyan-300 mb-2" target="_blank" rel="noreferrer" href={api.absoluteUrl(a.resumeUrl)}>View resume</a> : <div className="text-sm muted">No resume</div>}
                  {/* show form answers if present */}
                  {a.formAnswers && Object.keys(a.formAnswers || {}).length > 0 && (
                    <div className="mt-2 text-sm bg-[rgba(255,255,255,0.02)] border p-2 rounded">
                      <div className="font-semibold mb-1">Application answers</div>
                      {Object.entries(a.formAnswers).map(([k,v])=> (
                        <div key={k} className="text-xs"><span className="font-medium">{k}:</span> {String(v)}</div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                      <button onClick={()=>updateStatus(selected,a,'accepted')} className="neo-btn">Accept</button>
                      <button onClick={()=>updateStatus(selected,a,'rejected')} className="neo-ghost">Reject</button>
                      <button onClick={()=>updateStatus(selected,a,'pending')} className="neo-ghost">Pending</button>
                    </div>
                    <div>
                      <StatusChip status={a.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (user && user.role === 'employer'){
    return (
      <div className="space-y-6">
        <div className="neo-card p-6">
          <h2 className="text-2xl font-bold">Employer Dashboard</h2>
          <p className="mt-2 muted">Post internships, view applicants and manage your hiring pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="neo-card p-4">
            <h3 className="font-semibold">Post Internship</h3>
            <form onSubmit={submit} className="space-y-2 mt-2">
              <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Title" className="neo-input w-full" />
              <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Description" className="neo-input w-full h-24" />
              <input value={form.requirements} onChange={e=>setForm({...form, requirements:e.target.value})} placeholder="Requirements (comma separated)" className="neo-input w-full" />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.field} onChange={e=>setForm({...form, field:e.target.value})} placeholder="Field" className="neo-input w-full" />
                <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder="Location" className="neo-input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.duration} onChange={e=>setForm({...form, duration:e.target.value})} placeholder="Duration" className="neo-input w-full" />
                <input value={form.stipend} onChange={e=>setForm({...form, stipend:e.target.value})} placeholder="Stipend" className="neo-input w-full" />
              </div>
              <input value={form.deadline} onChange={e=>setForm({...form, deadline:e.target.value})} placeholder="Deadline (YYYY-MM-DD)" className="neo-input w-full" />
              <div className="flex gap-2 items-center"><label className="text-sm muted"><input type="checkbox" checked={form.remote} onChange={e=>setForm({...form, remote:e.target.checked})} /> Remote</label>
              <label className="text-sm muted"><input type="checkbox" checked={form.paid} onChange={e=>setForm({...form, paid:e.target.checked})} /> Paid</label></div>
              <div className="flex gap-2">
                <button className="neo-btn">{editingId ? 'Save changes' : 'Post'}</button>
                {editingId && <button type="button" onClick={()=>{ setEditingId(null); setForm({ title:'', company: user?.name || '', field:'', location:'', remote:false, paid:false, description:'', requirements:'', duration:'', stipend:'', deadline:'' }) }} className="neo-ghost">Cancel</button>}
              </div>
            </form>
          </div>

          <div className="neo-card p-4 col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">My Postings</h3>
              <div className="flex items-center gap-3">
                <div className="text-sm muted">Notifications:</div>
                <div className="w-6 h-6 rounded-full bg-[#ff6b6b] text-white flex items-center justify-center text-xs">{notifications}</div>
              </div>
            </div>
            <div className="mt-2">
              <input placeholder="Search postings" value={searchText} onChange={e=>setSearchText(e.target.value)} className="neo-input w-full mb-2" />
              <div className="grid gap-3">
                {posts.filter(p => {
                  if (!searchText) return true;
                  const q = searchText.toLowerCase();
                  return (p.title || '').toLowerCase().includes(q) || (p.company || '').toLowerCase().includes(q) || (p.field || '').toLowerCase().includes(q)
                }).map(p=> (
                  <div key={p._id || p.id} className="neo-card p-3 flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-lg">{p.title || '(no title)'}</div>
                        <div className="text-sm muted">{p.company}</div>
                        <div className="ml-2 text-sm muted">{p.location}</div>
                      </div>
                      {p.description && <div className="text-sm muted mt-1">{p.description}</div>}
                      <div className="mt-2 text-xs muted">{p.field} • {p.duration || '—'} • {p.stipend || '—'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm muted">{(p.applicants||[]).length} applicants</div>
                      <div className="flex gap-2">
                          <button onClick={()=>viewApplicants(p)} className="neo-btn">View</button>
                          <button onClick={()=>startEdit(p)} className="neo-ghost">Edit</button>
                          {p.active ? (
                            <button onClick={async()=>{ if (!confirm('Take down this posting?')) return; try{ await api.patch(`/internships/${p._id}/takedown`); setPosts(prev=> prev.map(x=> x._id === p._id ? { ...x, active:false } : x)); }catch(e){ alert('Failed to take down') } }} className="neo-ghost">Take down</button>
                          ) : (
                            <button onClick={async()=>{ try{ await api.patch(`/internships/${p._id}/restore`); setPosts(prev=> prev.map(x=> x._id === p._id ? { ...x, active:true } : x)); }catch(e){ alert('Failed to restore') } }} className="neo-btn">Restore</button>
                          )}
                          <button onClick={()=>removePost(p)} className="neo-ghost">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="neo-card p-8">
        <h1 className="text-3xl font-bold">Employers — Find the right talent</h1>
        <p className="mt-2 muted">Post structured internship listings, filter applicants by skills and invite top candidates.</p>
        <div className="mt-4 flex gap-3">
          <Link to="/signup?role=employer" className="px-4 py-2 neo-btn">Create employer account</Link>
          <Link to="/login" className="px-4 py-2 neo-ghost">Login</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="neo-card p-4">
          <h3 className="font-semibold">Structured Postings</h3>
          <p className="text-sm muted">Define role, field, duration, location, stipend and skills required for clearer matches.</p>
        </div>
        <div className="neo-card p-4">
          <h3 className="font-semibold">Applicant Insights</h3>
          <p className="text-sm muted">See skills heatmaps, shortlisted candidates, and export applicant lists.</p>
        </div>
        <div className="neo-card p-4">
          <h3 className="font-semibold">Messaging & Invites</h3>
          <p className="text-sm muted">Shortlist, message and invite candidates for interviews directly from the dashboard.</p>
        </div>
      </section>
    </div>
  )
}
 

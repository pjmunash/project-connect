import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import { useModal } from '../contexts/ModalContext'

export default function AdminDashboard(){
  const modal = useModal()
  const [data, setData] = useState({ internships: [], users: [], universities: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    setLoading(true)
    api.get('/admin/system').then(r => {
      if (!mounted) return
      setData(r.data || { internships: [], users: [], universities: [] })
      setLoading(false)
    }).catch(e => { if (mounted) { setError(e.response?.data || e.message || String(e)); setLoading(false) } })
    return ()=> mounted = false
  }, [])

  const reload = async ()=>{
    setLoading(true)
    try{ const r = await api.get('/admin/system'); setData(r.data); setError(null) }catch(e){ setError(e.response?.data || e.message || String(e)) }
    setLoading(false)
  }

  const deleteUser = async (id)=>{
    const ok = await modal.showConfirm('Delete user? This cannot be undone.')
    if (!ok) return
    await api.delete(`/admin/user/${id}`)
    await reload()
  }

  const deleteInternship = async (id)=>{
    const ok = await modal.showConfirm('Delete internship? This cannot be undone.')
    if (!ok) return
    await api.delete(`/admin/internship/${id}`)
    await reload()
  }

  const deleteApplication = async (internshipId, appId)=>{
    const ok = await modal.showConfirm('Delete application? This cannot be undone.')
    if (!ok) return
    await api.delete(`/admin/internship/${internshipId}/application/${appId}`)
    await reload()
  }

  if (loading) return <div>Loading admin dashboard...</div>
  if (error) return <div className="text-red-400">Error: {JSON.stringify(error)}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Internships ({data.internships.length})</h2>
        <div className="mt-2 space-y-3">
          {data.internships.map(i => (
            <div key={i._id} className="neo-card p-3 flex justify-between items-start">
              <div>
                <div className="font-semibold">{i.title} — {i.company}</div>
                <div className="text-sm muted">{i.location} • {i.field} • Posted by: {i.postedBy?.name || i.postedBy?.email || 'Unknown'}</div>
                <div className="mt-2 text-sm">Applications: {i.applicants?.length || 0}</div>
                {i.applicants && i.applicants.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {i.applicants.map(a => (
                      <div key={a._id} className="p-2 border rounded">
                        <div><strong>Applicant:</strong> {a.user?.name || a.user?.email || 'Unknown'}</div>
                        <div><strong>Message:</strong> {a.message || '-'}</div>
                        <div className="mt-1"><button className="neo-ghost" onClick={()=> deleteApplication(i._id, a._id)}>Delete application</button></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <button className="neo-ghost" onClick={()=> deleteInternship(i._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Universities ({data.universities.length})</h2>
        <div className="mt-2 space-y-2">
          {data.universities.map(u => (
            <div key={u._id} className="neo-card p-3 flex justify-between">
              <div>{u.name || u.email} — {u.email}</div>
              <div><button className="neo-ghost" onClick={()=> deleteUser(u._id)}>Delete</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">All Users ({data.users.length})</h2>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.users.map(u => (
            <div key={u._id} className="neo-card p-3 flex justify-between items-center">
              <div>
                <div className="font-semibold">{u.name || u.email}</div>
                <div className="text-sm muted">{u.email} — {u.role}</div>
              </div>
              <div><button className="neo-ghost" onClick={()=> deleteUser(u._id)}>Delete</button></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

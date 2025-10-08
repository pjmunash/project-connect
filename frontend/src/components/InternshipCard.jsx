import React from 'react'

export default function InternshipCard({ job, onApply, isApplied }){
  return (
    <div className="neo-card lift-on-hover flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-lg">{job.title || 'Untitled role'}</h3>
        <div className="text-sm muted">{job.company} • {job.field}</div>
        <div className="mt-2 text-sm muted">{job.location} {job.remote ? '• Remote' : ''} {job.paid ? '• Paid' : '• Unpaid'}</div>
        {job.requirements && <div className="text-xs muted mt-2">{job.requirements}</div>}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={()=> onApply && onApply(job)} className={`rounded-md px-4 py-2 ${isApplied ? 'neo-ghost' : 'neo-btn'}`}>{isApplied ? 'Applied' : 'Apply'}</button>
        <div className="text-xs muted">Posted by {typeof job.postedBy === 'string' ? job.postedBy : (job.postedBy?.name || job.postedBy?.email || 'Unknown')}</div>
      </div>
    </div>
  )
}

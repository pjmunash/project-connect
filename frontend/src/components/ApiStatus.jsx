import React, { useEffect, useState } from 'react'
import api from '../lib/api'

export default function ApiStatus(){
  const [ok, setOk] = useState(null)
  useEffect(()=>{
    let mounted = true
    let id
    async function check(){
      try{
        // ping internships endpoint as a simple health check
        await api.get('/internships', { timeout: 3000 })
        if (mounted) setOk(true)
      }catch(e){
        if (mounted) setOk(false)
      }
    }
    check()
    id = setInterval(check, 5000)
    return ()=>{ mounted = false; clearInterval(id) }
  },[])

  if (ok === null) return <span className="text-sm muted">API: …</span>
  if (ok) return <span className="text-sm" style={{color: 'var(--accent)'}}>API: up</span>
  return <span className="text-sm" style={{color: 'var(--danger)'}}>API: down</span>
}

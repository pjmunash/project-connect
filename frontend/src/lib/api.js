import axios from 'axios'

// Primary fallback if no detection runs yet
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

const instance = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } })

// Probe ports 4000..4010 in the background and cache the first responsive base in localStorage.
// This is a best-effort convenience for dev where the backend may start on a different port.
const PROBE_PORTS = Array.from({ length: 11 }, (_, i) => 4000 + i)
const CACHE_KEY = 'opportunet_api_base'

function setBase(base){
  try{ localStorage.setItem(CACHE_KEY, base) }catch(e){}
  instance.defaults.baseURL = base
}

async function probePort(port, timeout = 1200){
  const url = `http://localhost:${port}/api/internships`
  try{
    const controller = new AbortController();
    const id = setTimeout(()=> controller.abort(), timeout)
    const res = await fetch(url, { method: 'GET', signal: controller.signal, mode: 'cors' })
    clearTimeout(id)
    // any network response (even 404/401/500) means the server is reachable on that port
    if (res) return `http://localhost:${port}/api`
  }catch(e){ /* not reachable */ }
  return null
}

// run detection once per page load (non-blocking)
(async function detectApiBase(){
  try{
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached){ instance.defaults.baseURL = cached; return }
  }catch(e){}
  // if env explicitly set, prefer it and cache it
  if (import.meta.env.VITE_API_BASE){ setBase(import.meta.env.VITE_API_BASE); return }
  for (const p of PROBE_PORTS){
    const base = await probePort(p)
    if (base){ setBase(base); return }
  }
  // fallback to API_BASE
  setBase(API_BASE)
})()

function absoluteUrl(path){
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('//')) return window.location.protocol + path
  // prefer cached detected base, fallback to env
  const base = (localStorage.getItem(CACHE_KEY) || API_BASE).replace(/\/api\/?$/, '')
  if (path.startsWith('/')) return base + path
  return base + '/' + path.replace(/^\//, '')
}

export default {
  get: (url, opts) => instance.get(url, opts),
  post: (url, data, opts) => instance.post(url, data, opts),
  put: (url, data, opts) => instance.put(url, data, opts),
  delete: (url, opts) => instance.delete(url, opts),
  setToken: (token) => { instance.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : undefined },
  absoluteUrl
}

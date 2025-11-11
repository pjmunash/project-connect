import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

const instance = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } })

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
    if (res) return `http://localhost:${port}/api`
  }catch(e){ }
  return null
}

(async function detectApiBase(){
  try{
    const cached = localStorage.getItem(CACHE_KEY)
    if (import.meta.env.VITE_API_BASE){
      setBase(import.meta.env.VITE_API_BASE)
      return
    }
    if (cached){
      try{
        const isLocalCached = /^https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(cached)
        const onLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        if (!(isLocalCached && !onLocalHost)){
          instance.defaults.baseURL = cached
          return
        }
      }catch(e){ }
    }
    for (const p of PROBE_PORTS){
      const base = await probePort(p)
      if (base){ setBase(base); return }
    }
    setBase(API_BASE)
  }catch(e){ }
})()

try{ window.OPPORTUNET_CLEAR_API_CACHE = () => { try{ localStorage.removeItem(CACHE_KEY); console.log('opportunet_api_base cleared') }catch(e){ console.warn('failed to clear opportunet_api_base', e) } } }catch(e){}

function absoluteUrl(path){
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('//')) return window.location.protocol + path
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

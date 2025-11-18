import React from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase'

export default function SignInWithGoogle({ onSuccess, onError, label='Continue with Google', role }){
  const handleGoogle = async ()=>{
    try{
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      if (role && result?.user?.email){
        try{
          const KEY = 'opportunet_roles'
          const raw = localStorage.getItem(KEY) || '{}'
          const map = JSON.parse(raw)
          map[result.user.email] = role
          localStorage.setItem(KEY, JSON.stringify(map))
        }catch(e){ }
      }
      if (onSuccess) onSuccess(result)
    }catch(e){ if (onError) onError(e); else console.error('Google sign-in failed', e) }
  }

  return (
    <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-2 px-3 py-2 neo-btn">
      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.9 0 7.3 1.3 9.9 3.7l7.4-7.3C36.9 2 30.8 0 24 0 14.7 0 6.9 4.8 2.9 12l8.6 6.7C13.8 13.1 18.5 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8h12.8c-.6 3.1-2.9 6.2-5.8 8.1L38 40.3C43.1 36.1 46.5 30.6 46.5 24.5z"/><path fill="#FBBC05" d="M10.6 28.7A14.7 14.7 0 0 1 9.7 24.5c0-1.6.3-3.1.9-4.5L2 13.8C-.2 17.6-1.5 21.7-1.5 24.5c0 2.8 1.3 6.9 3.5 10.7l8.6-6.5z"/><path fill="#34A853" d="M24 48c6.8 0 12.9-2 17.3-5.5l-8.7-6.6c-2.2 1.5-5 2.4-8.6 2.4-5.6 0-10.3-3.6-12-8.6L2.9 36C6.9 43.2 14.7 48 24 48z"/></svg>
      <span className="text-sm">{label}</span>
    </button>
  )
}

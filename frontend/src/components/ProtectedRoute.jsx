import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, role }){
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role && user.role !== 'admin') return <div className="p-6 bg-yellow-50">Forbidden: insufficient role</div>
  return children
}

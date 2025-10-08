import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import StudentPage from './pages/StudentPage'
import EmployerPage from './pages/EmployerPage'
import UniversityPage from './pages/UniversityPage'
import AuthGate from './pages/AuthGate'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

export default function App(){
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{background: 'var(--bg)'}}>
        <Navbar />
        <main className="container mx-auto p-6">
          <Routes>
            <Route path="/" element={<Landing/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/signup" element={<Signup/>} />
            <Route path="/auth" element={<AuthGate/>} />
            <Route path="/landing/student" element={<StudentPage/>} />
            <Route path="/landing/employer" element={<EmployerPage/>} />
            <Route path="/landing/university" element={<UniversityPage/>} />

            <Route path="/student" element={<ProtectedRoute role="student"><StudentPage/></ProtectedRoute>} />
            <Route path="/employer" element={<ProtectedRoute role="employer"><EmployerPage/></ProtectedRoute>} />
            <Route path="/university" element={<ProtectedRoute role="university"><UniversityPage/></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}

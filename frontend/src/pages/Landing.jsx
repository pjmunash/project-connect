import React from 'react'
import { Link } from 'react-router-dom'

const cards = [
  {
    key: 'student',
    title: 'Students',
    desc: 'Create a profile, generate AI resumes, browse internships and track applications.',
    img: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1200&q=60',
    cta: 'Join as Student'
  },
  {
    key: 'employer',
    title: 'Employers',
    desc: 'Post internships, review applicants, shortlist and message candidates.',
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=60',
    cta: 'Hire Interns'
  },
  {
    key: 'university',
    title: 'Universities',
    desc: 'Verify student credentials, monitor placements and generate reports.',
    img: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=60',
    cta: 'Partner with Us'
  }
]

export default function Landing(){
  return (
    <div className="space-y-10">
  <section className="rounded-lg overflow-hidden neo-card p-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold">OpportuNet — internships that fit your future</h1>
            <p className="mt-4 text-lg text-indigo-100 max-w-xl">Discover verified internships, hire talented students, and let universities track placements — all in one modern platform powered by AI and real-world verification.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/signup" className="px-5 py-3 neo-btn font-medium">Get Started</Link>
              <Link to="/student" className="px-5 py-3 neo-ghost">Explore</Link>
            </div>
          </div>
          <div className="flex-1 hidden md:block">
            <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=60" alt="students collaboration" className="rounded shadow-lg" />
          </div>
        </div>
      </section>

      <section className="container mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">Choose your role</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(card=> (
            <Link key={card.key} to={`/auth?role=${card.key}`} className="group block rounded-lg overflow-hidden shadow-lg transform transition hover:-translate-y-2">
              <div className="relative h-56">
                <img src={card.img} alt={card.title} loading="lazy" onError={(e)=>{ e.currentTarget.src = 'https://via.placeholder.com/1200x800?text=OpportuNet' }} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.0))'}} />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{card.title}</h3>
                  <p className="text-sm max-w-xs mt-1">{card.desc}</p>
                </div>
              </div>
                <div className="p-4 neo-card">
                  <div className="flex items-center justify-between">
                    <div className="font-medium" style={{color:'var(--muted)'}}>{card.cta}</div>
                    <div className="text-sm muted">Click to continue →</div>
                  </div>
                </div>
            </Link>
          ))}
        </div>
      </section>

      {import.meta.env.VITE_MOCK_AUTH === 'true' && (
        <section className="container mx-auto mt-6">
          <div className="p-4 neo-card">
            <h4 className="font-semibold">Mock accounts (mock mode)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 text-sm">
              <div className="p-2 neo-card"><strong>Admin</strong><div>admin@opportunet.test</div><div>password: admin</div></div>
              <div className="p-2 neo-card"><strong>Student</strong><div>student@opportunet.test</div><div>password: student</div></div>
              <div className="p-2 neo-card"><strong>Employer</strong><div>employer@opportunet.test</div><div>password: employer</div></div>
              <div className="p-2 neo-card"><strong>University</strong><div>university@opportunet.test</div><div>password: university</div></div>
            </div>
            <p className="text-xs muted mt-2">Click a role card to open signup prefilled, or use the credentials above on the login page.</p>
          </div>
        </section>
      )}

  <footer className="container mx-auto text-center py-8 text-sm muted">© {new Date().getFullYear()} OpportuNet · Built for students, employers & universities</footer>
    </div>
  )
}

import { useState, useEffect } from 'react'
import Onboarding from './Onboarding'
import Dashboard from './Dashboard'
import AuthGate from './AuthGate'
import { useTheme } from './hooks'
import { getSupabase } from './lib/supabase/client'
import { getSession, onAuthStateChange } from './lib/supabase/auth'
import { getProfile, updateProfile } from './lib/supabase/profile'

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="btn ghost sm"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 200, padding: '7px 13px', fontSize: 13 }}
    >
      {theme === 'dark' ? '☀ LIGHT' : '☾ DARK'}
    </button>
  )
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [chosen, setChosen] = useState(null)
  const [shikaiName, setShikaiName] = useState(null)
  const [session, setSession] = useState(undefined)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    const supabase = getSupabase()

    async function loadProfile() {
      try {
        const p = await getProfile(supabase)
        if (p.chosen_burners?.length) setChosen(p.chosen_burners)
        if (p.shikai_name) setShikaiName(p.shikai_name)
      } catch {}
    }

    getSession(supabase).then(s => {
      setSession(s)
      if (s) loadProfile()
    })

    return onAuthStateChange(supabase, s => {
      setSession(s)
      if (s) loadProfile()
      else { setChosen(null); setShikaiName(null) }
    })
  }, [])

  const handleComplete = async (ids, name) => {
    setChosen(ids)
    setShikaiName(name)
    try { await updateProfile(getSupabase(), { chosen_burners: ids, shikai_name: name }) } catch {}
  }

  const handleReset = () => {
    setTransitioning(true)
    setTimeout(async () => {
      try { await updateProfile(getSupabase(), { chosen_burners: [], shikai_name: null }) } catch {}
      setChosen(null)
      setShikaiName(null)
      setTransitioning(false)
    }, 380)
  }

  if (session === undefined) return null

  return (
    <div className="stage paper-grain" data-screen-label={!session ? 'Auth' : chosen ? 'Dashboard' : 'Onboarding'}>
      {!session
        ? <AuthGate supabase={getSupabase()} />
        : chosen && chosen.length > 0
          ? <Dashboard chosen={chosen} shikaiName={shikaiName} onReset={handleReset} />
          : <Onboarding onComplete={handleComplete} />
      }
      <div className={'wipe ' + (transitioning ? 'run' : '')} />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
    </div>
  )
}

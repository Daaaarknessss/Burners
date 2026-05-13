import { useState, useEffect } from 'react'
import Onboarding from './Onboarding'
import Dashboard from './Dashboard'
import AuthGate from './AuthGate'
import { useTheme } from './hooks'
import { getSupabase } from './lib/supabase/client'
import { getSession, onAuthStateChange, signOut } from './lib/supabase/auth'
import { getProfile, updateProfile } from './lib/supabase/profile'
import { getMyHealth } from './lib/supabase/streak'

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

function SeasonEnded({ shikaiName, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 4000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="stage" style={{ display: 'grid', placeItems: 'center', padding: '5vw' }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: 18 }}>
        <div className="eyebrow" style={{ opacity: 0.5 }}>// season over</div>
        <div className="display" style={{ fontSize: 72, lineHeight: 0.9, color: 'var(--red)' }}>SEASON<br />ENDED</div>
        {shikaiName && (
          <div className="hand" style={{ fontSize: 22, opacity: 0.6 }}>
            {shikaiName.toUpperCase()} has fallen.
          </div>
        )}
        <div className="mono" style={{ fontSize: 11, opacity: 0.35, letterSpacing: '0.15em' }}>
          seven days. zero logs. the season is gone.
        </div>
      </div>
    </div>
  )
}

function UsernameSetup({ onComplete }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const val = input.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(val)) {
      setError('3–20 chars, letters / numbers / underscore only')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onComplete(val)
    } catch (err) {
      setError(err.code === '23505' ? 'Username already taken.' : err.message)
      setSaving(false)
    }
  }

  return (
    <div className="stage" style={{ display: 'grid', placeItems: 'center', padding: '5vw' }}>
      <div className="panel reveal" style={{ width: '100%', maxWidth: 440, padding: 0 }}>
        <div style={{ padding: '20px 28px', borderBottom: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)' }}>
          <div className="eyebrow" style={{ opacity: 0.7 }}>// one more thing</div>
          <div className="display" style={{ fontSize: 36 }}>YOUR HANDLE</div>
        </div>
        <form onSubmit={submit} style={{ padding: '24px 28px', display: 'grid', gap: 18 }}>
          <div className="hand" style={{ fontSize: 18, opacity: 0.7, lineHeight: 1.4 }}>
            This is how other users find you in Bonds.<br />Pick something short and yours.
          </div>
          <div>
            <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 6 }}>username</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="mono" style={{ fontSize: 18, padding: '8px 10px', background: 'var(--ink)', color: 'var(--paper)', lineHeight: 1, flexShrink: 0 }}>@</div>
              <input
                className="ink-input"
                type="text"
                placeholder="yourhandle"
                value={input}
                onChange={e => { setInput(e.target.value.toLowerCase()); setError(null) }}
                maxLength={20}
                autoFocus
                style={{ flex: 1 }}
              />
            </div>
          </div>
          {error && <div className="mono" style={{ fontSize: 10, color: 'var(--red)' }}>{error}</div>}
          <button
            type="submit"
            className="btn red"
            disabled={saving || input.trim().length < 3}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {saving ? '...' : 'SET HANDLE ▸'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [chosen, setChosen] = useState(null)
  const [shikaiName, setShikaiName] = useState(null)
  const [username, setUsername] = useState(null)
  const [session, setSession] = useState(undefined)
  const [transitioning, setTransitioning] = useState(false)
  const [seasonDead, setSeasonDead] = useState(false)
  const [deadSeasonName, setDeadSeasonName] = useState(null)

  useEffect(() => {
    const supabase = getSupabase()

    async function loadProfile() {
      try {
        const p = await getProfile(supabase)
        if (p.chosen_burners?.length) setChosen(p.chosen_burners)
        if (p.shikai_name) setShikaiName(p.shikai_name)

        let uname = p.username || null
        if (!uname) {
          const pending = sessionStorage.getItem('pending_username')
          if (pending) {
            sessionStorage.removeItem('pending_username')
            try {
              await updateProfile(supabase, { username: pending })
              uname = pending
            } catch {}
          }
        }
        setUsername(uname)

        // Check if the season should die (7 days with no logs, after prior activity)
        if (p.chosen_burners?.length) {
          try {
            const { season_dead } = await getMyHealth(supabase)
            if (season_dead) {
              const { data: { user } } = await supabase.auth.getUser()
              setDeadSeasonName(p.shikai_name)
              setSeasonDead(true)
              await supabase.from('entries').delete().eq('user_id', user.id)
              await updateProfile(supabase, { chosen_burners: [], shikai_name: null })
              setChosen(null)
              setShikaiName(null)
            }
          } catch {}
        }
      } catch {}
    }

    getSession(supabase).then(s => {
      setSession(s)
      if (s) loadProfile()
    })

    return onAuthStateChange(supabase, s => {
      setSession(s)
      if (s) loadProfile()
      else { setChosen(null); setShikaiName(null); setUsername(null); setSeasonDead(false) }
    })
  }, [])

  const handleSetUsername = async (uname) => {
    await updateProfile(getSupabase(), { username: uname })
    setUsername(uname)
  }

  const handleComplete = async (ids, name) => {
    setChosen(ids)
    setShikaiName(name)
    try { await updateProfile(getSupabase(), { chosen_burners: ids, shikai_name: name }) } catch {}
  }

  const handleLogout = async () => {
    try { await signOut(getSupabase()) } catch {}
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
    <div className="stage paper-grain" data-screen-label={!session ? 'Auth' : !username ? 'Username' : chosen ? 'Dashboard' : 'Onboarding'}>
      {!session
        ? <AuthGate supabase={getSupabase()} />
        : seasonDead
          ? <SeasonEnded shikaiName={deadSeasonName} onContinue={() => setSeasonDead(false)} />
          : !username
            ? <UsernameSetup onComplete={handleSetUsername} />
            : chosen && chosen.length > 0
              ? <Dashboard chosen={chosen} shikaiName={shikaiName} username={username} onReset={handleReset} onLogout={handleLogout} userId={session?.user?.id} />
              : <Onboarding onComplete={handleComplete} />
      }
      <div className={'wipe ' + (transitioning ? 'run' : '')} />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
    </div>
  )
}

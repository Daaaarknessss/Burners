import { useState } from 'react'
import { signIn, signUp } from './lib/supabase/auth'
import { updateProfile } from './lib/supabase/profile'
import { HalftoneCorner } from './components'

export default function AuthGate({ supabase }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const isSignUp = mode === 'signup'

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setUsernameError(null)

    if (isSignUp) {
      const uname = username.trim().toLowerCase()
      if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
        setUsernameError('3–20 chars, letters / numbers / underscore only')
        return
      }
      setLoading(true)
      try {
        const result = await signUp(supabase, { email, password })
        if (result.session) {
          try { await updateProfile(supabase, { username: uname }) } catch {}
        } else {
          sessionStorage.setItem('pending_username', uname)
          setAwaitingConfirm(true)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        await signIn(supabase, { email, password })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  if (awaitingConfirm) {
    return (
      <div className="stage" style={{ display: 'grid', placeItems: 'center', padding: '5vw' }}>
        <div className="panel reveal" style={{ maxWidth: 440, padding: '36px 32px', textAlign: 'center', position: 'relative' }}>
          <HalftoneCorner corner="tr" size={80} />
          <div className="eyebrow" style={{ opacity: 0.6 }}>// check your inbox</div>
          <div className="display" style={{ fontSize: 48, marginTop: 8 }}>ALMOST.</div>
          <div className="hand" style={{ fontSize: 22, marginTop: 18, lineHeight: 1.25, opacity: 0.8 }}>
            Confirmation link sent to<br />
            <span style={{ color: 'var(--red)' }}>{email}</span>
          </div>
          <div className="mono" style={{ fontSize: 11, marginTop: 14, opacity: 0.45, letterSpacing: '0.1em' }}>
            click the link to activate your account.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="stage" style={{ display: 'grid', placeItems: 'center', padding: '5vw' }}>
      <div className="panel reveal" style={{ width: '100%', maxWidth: 440, padding: 0, position: 'relative' }}>
        <HalftoneCorner corner="tr" size={80} />

        <div style={{ padding: '20px 28px', borderBottom: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)' }}>
          <div className="eyebrow" style={{ opacity: 0.7 }}>// enter the dojo</div>
          <div className="display" style={{ fontSize: 36 }}>
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </div>
        </div>

        <form onSubmit={submit} style={{ padding: '24px 28px', display: 'grid', gap: 18 }}>
          <div>
            <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 6 }}>email</div>
            <input
              className="ink-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {isSignUp && (
            <div>
              <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 6 }}>username</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="mono" style={{ fontSize: 18, padding: '8px 10px', background: 'var(--ink)', color: 'var(--paper)', lineHeight: 1, flexShrink: 0 }}>@</div>
                <input
                  className="ink-input"
                  type="text"
                  placeholder="yourhandle"
                  value={username}
                  onChange={e => { setUsername(e.target.value.toLowerCase()); setUsernameError(null) }}
                  required
                  maxLength={20}
                  autoComplete="off"
                  style={{ flex: 1 }}
                />
              </div>
              {usernameError && (
                <div className="mono" style={{ fontSize: 10, color: 'var(--red)', marginTop: 5 }}>{usernameError}</div>
              )}
            </div>
          )}

          <div>
            <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 6 }}>password</div>
            <input
              className="ink-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </div>

          {error && (
            <div className="mono" style={{
              fontSize: 11,
              color: 'var(--red)',
              letterSpacing: '0.08em',
              padding: '8px 12px',
              border: '2px solid var(--red)',
              background: 'var(--red-soft)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn red"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? '...' : isSignUp ? 'CREATE ▸' : 'ENTER ▸'}
          </button>
        </form>

        <div style={{ padding: '0 28px 24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(null) }}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: '"Caveat", cursive',
              fontSize: 18,
              opacity: 0.6,
              borderBottom: '2px dashed var(--ink)',
              paddingBottom: 1,
            }}
          >
            {isSignUp ? 'already have an account? sign in →' : 'no account yet? create one →'}
          </button>
        </div>
      </div>
    </div>
  )
}

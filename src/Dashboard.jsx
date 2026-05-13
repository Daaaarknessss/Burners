import { useState, useEffect, useMemo, useRef } from 'react'
import { BURNERS, BurnerArt, MiniFlame, SFX, HalftoneCorner } from './components'
import { useIsMobile } from './hooks'
import { getSupabase } from './lib/supabase/client'
import { getEntries, addEntry as dbAddEntry, deleteEntry as dbDeleteEntry } from './lib/supabase/entries'
import { getStreak } from './lib/supabase/streak'
import { getPartnerships, searchProfiles, requestPartnership, respondToPartnership, removePartnership, getPartnerHealth } from './lib/supabase/partnerships'

function normaliseEntry(row) {
  return {
    id:        row.id,
    burnerId:  row.burner_id,
    action:    row.action,
    note:      row.note,
    intensity: row.intensity,
    tags:      row.tags ?? [],
    day:       row.day,
    createdAt: new Date(row.created_at).getTime(),
  }
}

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const todayKey = () => new Date().toISOString().slice(0, 10)

// ── Quick-tap action presets per burner ──
const BURNER_ACTIONS = {
  family:  ['Quality time', 'Deep talk', 'Dinner together', 'Helped out', 'Called them', 'Date night', 'Resolved conflict', 'Made memories'],
  friends: ['Hung out', 'Called / texted', 'Deep talk', 'Supported them', 'Planned something', 'Made memories', 'Laughed hard', 'Long catch-up'],
  health:  ['Workout', 'Walk / run', 'Meditated', 'Good sleep', 'Healthy meal', 'Rest day', 'Stretched', 'Morning routine'],
  work:    ['Deep work', 'Shipped it', 'Learned something', 'Long session', 'Meeting', 'Planning', 'Side project', 'Problem solved'],
}

const CONTEXT_TAGS = ['FOCUSED', 'TIRED', 'INSPIRED', 'TOUGH', 'PROUD', 'SOLO', 'TOGETHER', 'SHORT', 'LONG', 'RUSHED']

const INTENSITY_LABELS = { 1: 'LIGHT', 2: 'LOW', 3: 'MED', 4: 'HIGH', 5: 'MAX' }

export default function Dashboard({ chosen, shikaiName, username, onReset, onLogout, userId }) {
  const isMobile = useIsMobile()
  const [entries, setEntries] = useState([])
  const [streak, setStreak] = useState(1)
  const [mobileTab, setMobileTab] = useState('log')
  const [selectedDay, setSelectedDay] = useState(todayKey())
  const [view, setView] = useState('home')
  const supabase = getSupabase()

  useEffect(() => {
    getEntries(supabase, { from: new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10) })
      .then(rows => setEntries(rows.map(normaliseEntry)))
      .catch(() => {})
    getStreak(supabase).then(setStreak).catch(() => {})
  }, [])

  const addEntry = async (e) => {
    try {
      const row = await dbAddEntry(supabase, e)
      setEntries(prev => [normaliseEntry(row), ...prev])
    } catch {}
  }
  const removeEntry = async (id) => {
    try {
      await dbDeleteEntry(supabase, id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch {}
  }

  const isToday = selectedDay === todayKey()
  const selectedEntries = entries.filter(e => e.day === selectedDay)
  const chosenBurners = BURNERS.filter(b => chosen.includes(b.id))

  const handleDaySelect = (day) => {
    setSelectedDay(day)
    if (isMobile) setMobileTab('log')
  }

  return (
    <div
      className="dash-root paper-grain"
      style={{ height: '100%', position: 'relative', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 18, padding: '22px 28px 18px' }}
    >
      <DashHeader chosenBurners={chosenBurners} streak={streak} onReset={onReset} onLogout={onLogout} entryCount={selectedEntries.length} isMobile={isMobile} shikaiName={shikaiName} isToday={isToday} bondsActive={view === 'bonds'} onBondsClick={() => setView(v => v === 'bonds' ? 'home' : 'bonds')} />

      {isMobile ? (
        <>
          <div className="mobile-tabs" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <button className={`mobile-tab ${mobileTab === 'log' ? 'active' : ''}`} onClick={() => setMobileTab('log')}>
              THE LOG
              {selectedEntries.length > 0 && <span className="mobile-tab-count">{selectedEntries.length}</span>}
            </button>
            <button className={`mobile-tab ${mobileTab === 'add' ? 'active' : ''}`} onClick={() => setMobileTab('add')}>
              ADD ENTRY
            </button>
            <button className={`mobile-tab ${mobileTab === 'bonds' ? 'active' : ''}`} onClick={() => setMobileTab('bonds')} style={{ borderRight: 'none' }}>
              BONDS
            </button>
          </div>
          <div className="dash-tab-panel">
            {mobileTab === 'log' && <EntryList entries={selectedEntries} onRemove={removeEntry} selectedDay={selectedDay} isToday={isToday} />}
            {mobileTab === 'add' && <Composer chosenBurners={chosenBurners} onAdd={addEntry} onSubmitSuccess={() => { setMobileTab('log'); setSelectedDay(todayKey()) }} isMobile={isMobile} />}
            {mobileTab === 'bonds' && <BondsPanel userId={userId} username={username} isMobile={isMobile} />}
          </div>
        </>
      ) : (
        view === 'bonds'
          ? <BondsPanel userId={userId} username={username} isMobile={isMobile} />
          : <div className="dash-body" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 22, minHeight: 0 }}>
              <EntryList entries={selectedEntries} onRemove={removeEntry} selectedDay={selectedDay} isToday={isToday} />
              <Composer chosenBurners={chosenBurners} onAdd={addEntry} onSubmitSuccess={() => setSelectedDay(todayKey())} isMobile={isMobile} />
            </div>
      )}

      <WeekStrip entries={entries} chosenBurners={chosenBurners} isMobile={isMobile} selectedDay={selectedDay} onDaySelect={handleDaySelect} />
    </div>
  )
}

// ── Header ──────────────────────────────────────────────────────────────────

function DashHeader({ chosenBurners, streak, onReset, onLogout, entryCount, isMobile, shikaiName, isToday, bondsActive, onBondsClick }) {
  const dateStr = fmtDate(new Date()).toUpperCase()
  return (
    <div className="dash-header reveal" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'end' }}>
      <div style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ opacity: 0.6 }}>// chapter 02 — the daily log</div>
        {shikaiName && (
          <div className="shikai-badge" style={{ marginTop: 5, marginBottom: 2 }}>
            <span style={{ opacity: 0.55 }}>season</span>
            <span style={{ color: 'var(--red)' }}>{shikaiName.toUpperCase()}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 6, flexWrap: 'wrap' }}>
          <div className="display dash-header-day" style={{ fontSize: 68, lineHeight: 0.85 }}>
            DAY <span style={{ color: 'var(--red)' }}>{String(Math.max(streak, 1)).padStart(2, '0')}</span>
          </div>
          <div className="mono" style={{ fontSize: 12, opacity: 0.6 }}>{dateStr}</div>
        </div>
        <div className="hand" style={{ fontSize: isMobile ? 18 : 22, marginTop: 6, opacity: 0.75 }}>
          {entryCount === 0
            ? (isToday ? 'log your first move of the day.' : 'nothing logged this day.')
            : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} ${isToday ? 'burning so far.' : 'that day.'}`}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div className="panel-sm" style={{ padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {!isMobile && <div className="eyebrow" style={{ opacity: 0.6 }}>burning</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {chosenBurners.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', border: '2px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)' }}>
                <MiniFlame size={12} />
                <span className="display" style={{ fontSize: isMobile ? 13 : 16 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        {!isMobile && (
          <button className="btn ghost sm" onClick={onBondsClick} style={bondsActive ? { background: 'var(--ink)', color: 'var(--paper)' } : {}}>
            {bondsActive ? '◂ BACK' : 'BONDS'}
          </button>
        )}
        <button className="btn ghost sm" onClick={onReset} title="Pick new burners">
          {isMobile ? '↻' : '↻ reset'}
        </button>
        <button className="btn ghost sm" onClick={onLogout} style={{ opacity: 0.7 }} title="Sign out">
          {isMobile ? '↩' : '↩ out'}
        </button>
      </div>
    </div>
  )
}

// ── Entry list ───────────────────────────────────────────────────────────────

function EntryList({ entries, onRemove, selectedDay, isToday }) {
  const dayLabel = isToday
    ? '// today'
    : `// ${new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}`

  return (
    <div className="panel reveal" style={{ padding: 0, display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0 }}>
      <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper-2)' }}>
        <div>
          <div className="eyebrow" style={{ opacity: 0.6 }}>{dayLabel}</div>
          <div className="display" style={{ fontSize: 30 }}>the log</div>
        </div>
        <SFX rotate={-6} size={28} style={{ position: 'static' }} color="var(--red)">{entries.length > 0 ? 'BOOM!' : '...'}</SFX>
      </div>
      <div className="scroll" style={{ padding: 18 }}>
        {entries.length === 0 ? <EmptyState isToday={isToday} /> : (
          <div style={{ display: 'grid', gap: 14 }}>
            {entries.map((e, i) => {
              const b = BURNERS.find(x => x.id === e.burnerId)
              return <EntryCard key={e.id} entry={e} burner={b} onRemove={() => onRemove(e.id)} index={i} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ isToday }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '30px 10px', textAlign: 'center', position: 'relative' }}>
      <div style={{ transform: 'scale(0.85)' }}><BurnerArt ignited={false} size={140} /></div>
      <div className="display" style={{ fontSize: 36, marginTop: 14 }}>cold stove.</div>
      <div className="hand" style={{ fontSize: 20, opacity: 0.7, maxWidth: 340 }}>
        {isToday ? 'nothing logged yet. throw a log on the fire →' : 'nothing was logged this day.'}
      </div>
      <SFX rotate={-12} size={40} top={20} right={40} color="var(--red)">silence...</SFX>
    </div>
  )
}

function EntryCard({ entry, burner, onRemove, index }) {
  // Split "action · tag1, tag2" for display
  const [mainAction, tagStr] = entry.action.split(' · ')
  const tags = tagStr ? tagStr.split(', ') : []
  return (
    <div className="panel-sm slide-up" style={{ padding: 14, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, animationDelay: `${index * 0.04}s`, alignItems: 'start' }}>
      <div style={{ display: 'grid', placeItems: 'center', padding: 6, border: '3px solid var(--ink)', background: 'var(--paper-2)' }}>
        <BurnerArt ignited={true} size={48} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div className="display" style={{ fontSize: 18, color: 'var(--red)' }}>{burner?.label}</div>
          <div className="mono" style={{ fontSize: 10, opacity: 0.5 }}>
            {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{mainAction}</div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {tags.map(t => (
              <span key={t} style={{ fontFamily: '"Special Elite", monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 6px', border: '1.5px solid var(--ink)', opacity: 0.65 }}>{t}</span>
            ))}
          </div>
        )}
        {entry.note && <div className="hand" style={{ fontSize: 18, marginTop: 5, lineHeight: 1.1, opacity: 0.8 }}>{entry.note}</div>}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{ width: 18, height: 10, border: '1.5px solid var(--ink)', background: n <= entry.intensity ? 'var(--red)' : 'transparent', transition: 'background 0ms' }} />
          ))}
          <span className="mono" style={{ fontSize: 9, opacity: 0.55, marginLeft: 4 }}>{INTENSITY_LABELS[entry.intensity]}</span>
        </div>
      </div>
      <button className="btn ghost sm" onClick={onRemove} style={{ fontSize: 11, padding: '4px 8px' }} title="remove">✕</button>
    </div>
  )
}

// ── Composer — tap-first, no text fields by default ──────────────────────────

function Composer({ chosenBurners, onAdd, onSubmitSuccess, isMobile }) {
  const [burnerId, setBurnerId] = useState(chosenBurners[0]?.id || '')
  const [selectedAction, setSelectedAction] = useState(null) // preset string or 'custom'
  const [customText, setCustomText] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [activeTags, setActiveTags] = useState([])
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const customRef = useRef(null)

  // Reset action when burner changes
  useEffect(() => {
    setSelectedAction(null)
    setCustomText('')
  }, [burnerId])

  useEffect(() => {
    if (!chosenBurners.find(b => b.id === burnerId)) {
      setBurnerId(chosenBurners[0]?.id || '')
    }
  }, [chosenBurners])

  useEffect(() => {
    if (selectedAction === 'custom') customRef.current?.focus()
  }, [selectedAction])

  const actions = BURNER_ACTIONS[burnerId] || []
  const canSubmit = selectedAction && (selectedAction !== 'custom' || customText.trim())

  const submit = async () => {
    if (!canSubmit) return
    const actionStr = selectedAction === 'custom' ? customText.trim() : selectedAction
    const tagStr = activeTags.length ? ' · ' + activeTags.join(', ') : ''
    await onAdd({ burnerId, action: actionStr + tagStr, note: note.trim(), intensity, day: todayKey() })
    setSelectedAction(null)
    setCustomText('')
    setActiveTags([])
    setNote('')
    setNoteOpen(false)
    setIntensity(3)
    onSubmitSuccess?.()
  }

  const toggleTag = (tag) => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  return (
    <div
      className="panel reveal"
      style={isMobile
        ? { padding: 0, display: 'flex', flexDirection: 'column', position: 'relative' }
        : { padding: 0, display: 'grid', gridTemplateRows: 'auto 1fr auto', minHeight: 0, position: 'relative' }}
    >
      <HalftoneCorner corner="br" size={120} />

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)' }}>
        <div className="eyebrow" style={{ opacity: 0.7 }}>// new entry</div>
        <div className="display" style={{ fontSize: 30 }}>FEED A FLAME</div>
      </div>

      {/* Body — scrolls via page on mobile, inner scroll on desktop */}
      <div className={isMobile ? '' : 'scroll'} style={{ padding: isMobile ? 16 : 18, display: 'grid', gap: 22, alignContent: 'start' }}>

        {/* ① Burner selector */}
        <div>
          <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 8 }}>tag the burner</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chosenBurners.length}, 1fr)`, gap: 8 }}>
            {chosenBurners.map(b => {
              const active = b.id === burnerId
              return (
                <button key={b.id} onClick={() => setBurnerId(b.id)} style={{
                  all: 'unset', cursor: 'pointer',
                  border: '3px solid var(--ink)',
                  boxShadow: active ? '4px 4px 0 0 var(--ink)' : '2px 2px 0 0 var(--ink)',
                  background: active ? 'var(--red)' : 'var(--paper)',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                  padding: '10px 12px', transition: 'all 180ms',
                  transform: active ? 'translate(-2px,-2px)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <BurnerArt ignited={active} size={28} />
                  <div style={{ display: 'grid' }}>
                    <span className="display" style={{ fontSize: 16, lineHeight: 1 }}>{b.label}</span>
                    <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>{b.kana}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ② Action grid — tap to pick */}
        <div>
          <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 10 }}>what did you do?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {actions.map(action => {
              const active = selectedAction === action
              return (
                <button
                  key={action}
                  onClick={() => setSelectedAction(active ? null : action)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    border: `3px solid var(--ink)`,
                    background: active ? 'var(--ink)' : 'var(--paper)',
                    color: active ? 'var(--paper)' : 'var(--ink)',
                    boxShadow: active ? '4px 4px 0 0 var(--red)' : '2px 2px 0 0 var(--ink)',
                    padding: '11px 13px',
                    transition: 'all 160ms cubic-bezier(.2,.7,.2,1)',
                    transform: active ? 'translate(-2px,-2px)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{action}</span>
                  {active && <span className="display" style={{ fontSize: 14, color: 'var(--red)', flexShrink: 0 }}>✓</span>}
                </button>
              )
            })}
            {/* Custom text fallback */}
            <button
              onClick={() => setSelectedAction(selectedAction === 'custom' ? null : 'custom')}
              style={{
                all: 'unset', cursor: 'pointer',
                border: '2px dashed var(--ink)',
                background: selectedAction === 'custom' ? 'var(--paper-2)' : 'transparent',
                color: 'var(--ink)', opacity: 0.6,
                padding: '11px 13px', transition: 'all 160ms',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
              <span className="mono" style={{ fontSize: 11 }}>custom</span>
            </button>
          </div>

          {/* Custom text input — only shows if "custom" selected */}
          {selectedAction === 'custom' && (
            <input
              ref={customRef}
              className="ink-input"
              placeholder="describe what you did..."
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        {/* ③ Intensity — 5 tap targets, no slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div className="eyebrow" style={{ opacity: 0.6 }}>intensity</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--red-deep)', letterSpacing: '0.15em' }}>
              {INTENSITY_LABELS[intensity]}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => {
              const filled = n <= intensity
              return (
                <button
                  key={n}
                  onClick={() => setIntensity(n)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    border: '3px solid var(--ink)',
                    background: filled ? (n === 5 ? 'var(--red)' : 'var(--ink)') : 'var(--paper)',
                    color: filled ? 'var(--paper)' : 'var(--ink)',
                    padding: '12px 0',
                    textAlign: 'center',
                    transition: 'all 120ms cubic-bezier(.2,.7,.2,1)',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <div className="display" style={{ fontSize: 20, lineHeight: 1 }}>{n}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ④ Context tags — optional toggles */}
        <div>
          <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 8 }}>
            context <span style={{ opacity: 0.45, textTransform: 'none', letterSpacing: 0, fontFamily: '"DM Sans", sans-serif' }}>(optional)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CONTEXT_TAGS.map(tag => {
              const active = activeTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    border: '2px solid var(--ink)',
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--paper)' : 'var(--ink)',
                    padding: '5px 10px',
                    transition: 'all 140ms',
                    fontFamily: '"Special Elite", monospace',
                    fontSize: 10, letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* ⑤ Note — collapsed by default */}
        <div>
          {!noteOpen ? (
            <button
              onClick={() => setNoteOpen(true)}
              style={{
                all: 'unset', cursor: 'pointer',
                fontFamily: '"Caveat", cursive', fontSize: 20,
                opacity: 0.5,
                borderBottom: '2px dashed var(--ink)',
                paddingBottom: 2,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>＋</span> add a note...
            </button>
          ) : (
            <div>
              <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 6 }}>note</div>
              <textarea
                className="ink-input"
                placeholder="how did it feel?"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '3px solid var(--ink)',
        background: canSubmit ? 'var(--ink)' : 'var(--paper-2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        transition: 'background 280ms',
        marginTop: isMobile ? 0 : undefined,
      }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          {canSubmit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--paper)', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedAction === 'custom' ? customText : selectedAction}
              </span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--red)' }}>·</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--paper)', opacity: 0.7 }}>{INTENSITY_LABELS[intensity]}</span>
              {activeTags.length > 0 && <>
                <span className="mono" style={{ fontSize: 10, color: 'var(--red)' }}>·</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--paper)', opacity: 0.6 }}>{activeTags.length} tag{activeTags.length > 1 ? 's' : ''}</span>
              </>}
            </div>
          ) : (
            <span className="mono" style={{ fontSize: 10, opacity: 0.4 }}>pick an action above</span>
          )}
        </div>
        <button
          className="btn red"
          disabled={!canSubmit}
          onClick={submit}
          style={isMobile ? { flexShrink: 0 } : {}}
        >
          LOG IT ▸
        </button>
      </div>
    </div>
  )
}

// ── Bonds ────────────────────────────────────────────────────────────────────

function HealthBar({ value }) {
  if (value === null) return <div className="mono" style={{ fontSize: 10, opacity: 0.4, marginTop: 8 }}>calculating...</div>
  const segments = 10
  const filled = Math.round((value / 100) * segments)
  const color = value > 60 ? 'var(--red)' : value > 30 ? 'oklch(0.55 0.28 45)' : 'oklch(0.38 0.22 18)'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 12, border: '2px solid var(--ink)', background: i < filled ? color : 'transparent' }} />
        ))}
      </div>
      <div className="mono" style={{ fontSize: 9, opacity: 0.55, marginTop: 4, letterSpacing: '0.1em' }}>
        HP {value}/100 · 7-day activity
      </div>
    </div>
  )
}

function PartnerCard({ partnership, userId, profileCache = {} }) {
  const [health, setHealth] = useState(null)
  const supabase = getSupabase()
  const partnerId = partnership.requester_id === userId ? partnership.partner_id : partnership.requester_id
  const profile   = (partnership.requester_id === userId ? partnership.partner : partnership.requester) || profileCache[partnerId]

  useEffect(() => {
    getPartnerHealth(supabase, partnerId).then(setHealth).catch(() => setHealth(0))
  }, [partnerId])

  return (
    <div className="panel-sm" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="display" style={{ fontSize: 22 }}>
            {profile?.username ? `@${profile.username}` : <span style={{ opacity: 0.4, fontSize: 14 }}>handle not set yet</span>}
          </div>
          {profile?.shikai_name && (
            <div className="eyebrow" style={{ opacity: 0.55, marginTop: 2 }}>season // {profile.shikai_name}</div>
          )}
        </div>
        <button
          className="btn ghost sm"
          onClick={async () => { await removePartnership(supabase, partnership.id).catch(() => {}) ; window.location.reload() }}
          style={{ fontSize: 10, padding: '4px 8px', opacity: 0.5 }}
          title="Remove bond"
        >✕</button>
      </div>
      <HealthBar value={health} />
    </div>
  )
}

function BondsPanel({ userId, username, isMobile }) {
  const [partnerships, setPartnerships] = useState([])
  const [loading, setLoading]           = useState(true)
  const [profileCache, setProfileCache] = useState({}) // partnerId → {username, shikai_name}
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState([])
  const [selected, setSelected]         = useState(null)
  const [searching, setSearching]       = useState(false)
  const [sending, setSending]           = useState(false)
  const [sendError, setSendError]       = useState(null)
  const [sendOk, setSendOk]             = useState(false)
  const searchTimeout                   = useRef(null)
  const supabase                        = getSupabase()

  const reload = () => {
    setLoading(true)
    getPartnerships(supabase)
      .then(rows => {
        setPartnerships(rows)
        // seed cache from any profiles that came back with the join
        const extra = {}
        rows.forEach(p => {
          if (p.requester_id !== userId && p.requester?.username) extra[p.requester_id] = p.requester
          if (p.partner_id   !== userId && p.partner?.username)   extra[p.partner_id]   = p.partner
        })
        if (Object.keys(extra).length) setProfileCache(prev => ({ ...prev, ...extra }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const active     = partnerships.filter(p => p.status === 'active')
  const incoming   = partnerships.filter(p => p.partner_id === userId && p.status === 'pending')
  const outgoing   = partnerships.filter(p => p.requester_id === userId && p.status === 'pending')
  const isUnlocked = partnerships.some(p => p.partner_id === userId && p.status === 'active')

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setSelected(null)
    setSendError(null)
    setSendOk(false)
    clearTimeout(searchTimeout.current)
    if (val.trim().length < 2) { setResults([]); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const r = await searchProfiles(supabase, val.trim())
        setResults(r)
      } catch {}
      setSearching(false)
    }, 300)
  }

  const selectUser = (user) => {
    setSelected(user)
    setQuery('@' + user.username)
    setResults([])
  }

  const sendRequest = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSendError(null)
    setSendOk(false)
    setSending(true)
    try {
      await requestPartnership(supabase, selected.id)
      setProfileCache(prev => ({ ...prev, [selected.id]: { username: selected.username, shikai_name: selected.shikai_name } }))
      setQuery('')
      setSelected(null)
      setSendOk(true)
      reload()
    } catch (err) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  const respond = async (id, status) => {
    await respondToPartnership(supabase, id, status).catch(() => {})
    reload()
  }

  if (loading) {
    return (
      <div className="panel reveal" style={{ padding: 28, display: 'grid', placeItems: 'center', minHeight: 200 }}>
        <div className="mono" style={{ opacity: 0.4, fontSize: 12, letterSpacing: '0.1em' }}>loading bonds...</div>
      </div>
    )
  }

  return (
    <div className="panel reveal" style={{ padding: 0, display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0 }}>
      <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow" style={{ opacity: 0.7 }}>// accountability</div>
          <div className="display" style={{ fontSize: 30 }}>BONDS</div>
        </div>
        <div className="mono" style={{ fontSize: 11, opacity: 0.6, paddingBottom: 4 }}>@{username}</div>
      </div>

      <div className="scroll" style={{ padding: 20, display: 'grid', gap: 24, alignContent: 'start' }}>

        {/* ── Locked notice ── */}
        {!isUnlocked && (
          <div style={{ padding: '16px 18px', border: '2px solid var(--ink)', background: 'var(--paper-2)' }}>
            <div className="display" style={{ fontSize: 15, marginBottom: 4 }}>○ LOCKED</div>
            <div className="hand" style={{ fontSize: 15, opacity: 0.65, lineHeight: 1.4 }}>
              Accept someone's request to unlock watching others.<br />
              You must be watched before you can watch.
            </div>
          </div>
        )}

        {/* ── Active bonds ── */}
        {isUnlocked && active.length > 0 && (
          <div>
            <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 12 }}>active bonds</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {active.map(p => <PartnerCard key={p.id} partnership={p} userId={userId} profileCache={profileCache} />)}
            </div>
          </div>
        )}
        {isUnlocked && active.length === 0 && (
          <div className="hand" style={{ opacity: 0.5, fontSize: 16 }}>no active bonds yet.</div>
        )}

        {/* ── Incoming requests ── */}
        {incoming.length > 0 && (
          <div>
            <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 10 }}>
              incoming <span style={{ color: 'var(--red)' }}>· {incoming.length}</span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {incoming.map(p => {
                const from = p.requester || profileCache[p.requester_id]
                return (
                  <div key={p.id} className="panel-sm" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div className="display" style={{ fontSize: 18 }}>{from?.username ? `@${from.username}` : '(no handle)'}</div>
                      {from?.shikai_name && <div className="mono" style={{ fontSize: 9, opacity: 0.5 }}>season // {from.shikai_name}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn red sm" onClick={() => respond(p.id, 'active')} style={{ fontSize: 12 }}>ACCEPT</button>
                      <button className="btn ghost sm" onClick={() => respond(p.id, 'declined')} style={{ fontSize: 11, opacity: 0.6 }}>decline</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Outgoing pending ── */}
        {outgoing.length > 0 && (
          <div>
            <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 10 }}>waiting on reply</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {outgoing.map(p => {
                const prof = p.partner || profileCache[p.partner_id]
                return (
                <div key={p.id} className="panel-sm" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div className="display" style={{ fontSize: 15 }}>{prof?.username ? `@${prof.username}` : '(no handle)'}</div>
                    {prof?.shikai_name && <div className="mono" style={{ fontSize: 9, opacity: 0.5 }}>season // {prof.shikai_name}</div>}
                  </div>
                  <button className="btn ghost sm" onClick={async () => { await removePartnership(supabase, p.id).catch(() => {}); reload() }} style={{ fontSize: 10, padding: '4px 8px', opacity: 0.6 }}>cancel</button>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* ── Add partner ── */}
        <div>
          <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 10 }}>find by username</div>
          <form onSubmit={sendRequest} style={{ display: 'grid', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <input
                className="ink-input"
                type="text"
                placeholder="@username..."
                value={query}
                onChange={handleQueryChange}
                autoComplete="off"
              />
              {(results.length > 0 || (searching && query.length >= 2)) && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--paper-2)', border: '2px solid var(--ink)', borderTop: 'none',
                  maxHeight: 220, overflowY: 'auto'
                }}>
                  {searching && (
                    <div className="mono" style={{ padding: '10px 14px', fontSize: 10, opacity: 0.4 }}>searching...</div>
                  )}
                  {results.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: 'none', border: 'none', borderBottom: '1px solid var(--ink)',
                        cursor: 'pointer', display: 'grid', gap: 2
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div className="display" style={{ fontSize: 16, color: 'var(--ink)' }}>@{u.username}</div>
                      {u.shikai_name && <div className="mono" style={{ fontSize: 9, opacity: 0.5 }}>season // {u.shikai_name}</div>}
                    </button>
                  ))}
                  {!searching && results.length === 0 && query.length >= 2 && (
                    <div className="mono" style={{ padding: '10px 14px', fontSize: 10, opacity: 0.4 }}>no users found.</div>
                  )}
                </div>
              )}
            </div>
            {selected && (
              <div style={{ padding: '8px 12px', background: 'var(--paper-3)', border: '2px solid var(--red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="display" style={{ fontSize: 15 }}>@{selected.username}</div>
                  {selected.shikai_name && <div className="mono" style={{ fontSize: 9, opacity: 0.5 }}>season // {selected.shikai_name}</div>}
                </div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--red)' }}>selected ✓</div>
              </div>
            )}
            {sendError && <div className="mono" style={{ fontSize: 10, color: 'var(--red)' }}>{sendError}</div>}
            {sendOk && <div className="mono" style={{ fontSize: 10, opacity: 0.6 }}>request sent.</div>}
            <button type="submit" className="btn red sm" disabled={sending || !selected} style={{ justifySelf: 'start' }}>
              {sending ? '...' : 'SEND REQUEST ▸'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

// ── Week strip ───────────────────────────────────────────────────────────────

function WeekStrip({ entries, chosenBurners, isMobile, selectedDay, onDaySelect }) {
  const days = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return d
    })
  }, [])

  const cellHeat = (dayKey, burnerId) => {
    const sum = entries.filter(e => e.day === dayKey && e.burnerId === burnerId).reduce((acc, e) => acc + e.intensity, 0)
    return Math.min(sum, 12)
  }

  const dayLabel = (d, idx) => idx === 6 ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()

  return (
    <div className="week-strip panel-sm reveal" style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="eyebrow" style={{ opacity: 0.6 }}>// the season</div>
        <div className="display" style={{ fontSize: isMobile ? 18 : 22 }}>past 7 days</div>
      </div>
      <div className="week-rows" style={{ display: 'grid', gap: 8 }}>
        {chosenBurners.map(b => (
          <div key={b.id} className="week-heat-row" style={{ display: 'grid', gridTemplateColumns: '110px repeat(7, 1fr)', gap: 6, alignItems: 'center' }}>
            <div className="display" style={{ fontSize: 14, color: 'var(--red)' }}>{b.label}</div>
            {days.map((d, idx) => {
              const k = d.toISOString().slice(0, 10)
              const heat = cellHeat(k, b.id)
              const alpha = heat === 0 ? 0 : 0.25 + (heat / 12) * 0.75
              const selected = k === selectedDay
              return (
                <button
                  key={k}
                  onClick={() => onDaySelect(k)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    border: selected ? '2px solid var(--red)' : '2px solid var(--ink)',
                    boxShadow: selected ? 'inset 0 0 0 1px var(--red)' : 'none',
                    height: 30,
                    background: heat === 0 ? 'var(--paper)' : `oklch(0.52 0.24 18 / ${alpha})`,
                    display: 'grid', placeItems: 'center',
                    transition: 'border-color 150ms',
                  }}
                >
                  <div className="mono" style={{ fontSize: 8, opacity: selected ? 1 : 0.7, color: selected ? 'var(--red)' : 'var(--ink)', fontWeight: selected ? 700 : 400 }}>{dayLabel(d, idx)}</div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect, useMemo, useRef } from 'react'
import { BURNERS, BurnerArt, MiniFlame, SFX, HalftoneCorner } from './components'

const STORAGE_KEY = 'burners.v1'

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null } catch { return null }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const todayKey = () => new Date().toISOString().slice(0, 10)

export default function Dashboard({ chosen, onReset }) {
  const initial = loadState()
  const [entries, setEntries] = useState(initial?.entries || [])
  const [streak] = useState(initial?.streak || 1)

  useEffect(() => {
    saveState({ chosen, entries, streak })
  }, [chosen, entries, streak])

  const addEntry = (e) => setEntries(prev => [{ ...e, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev])
  const removeEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id))

  const todays = entries.filter(e => e.day === todayKey())
  const chosenBurners = BURNERS.filter(b => chosen.includes(b.id))

  return (
    <div className="stage paper-grain" style={{ position: 'relative', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 18, padding: '22px 28px 18px' }}>
      <DashHeader chosenBurners={chosenBurners} streak={streak} onReset={onReset} entryCount={todays.length} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 22, minHeight: 0 }}>
        <EntryList entries={todays} onRemove={removeEntry} />
        <Composer chosenBurners={chosenBurners} onAdd={addEntry} />
      </div>

      <WeekStrip entries={entries} chosenBurners={chosenBurners} />
    </div>
  )
}

function DashHeader({ chosenBurners, streak, onReset, entryCount }) {
  const dateStr = fmtDate(new Date()).toUpperCase()
  return (
    <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'end' }}>
      <div style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ opacity: 0.6 }}>// chapter 02 — the daily log</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 6, flexWrap: 'wrap' }}>
          <div className="display" style={{ fontSize: 68, lineHeight: 0.85 }}>
            DAY <span style={{ color: 'var(--red)' }}>{String(streak).padStart(2, '0')}</span>
          </div>
          <div className="mono" style={{ fontSize: 12, opacity: 0.6 }}>{dateStr}</div>
        </div>
        <div className="hand" style={{ fontSize: 22, marginTop: 6, opacity: 0.75 }}>
          {entryCount === 0 ? 'log your first move of the day.' : `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} burning so far.`}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="panel-sm" style={{ padding: '8px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div className="eyebrow" style={{ opacity: 0.6 }}>burning</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {chosenBurners.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '2px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)' }}>
                <MiniFlame size={14} />
                <span className="display" style={{ fontSize: 16 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="btn ghost sm" onClick={onReset} title="Pick new burners">↻ reset season</button>
      </div>
    </div>
  )
}

function EntryList({ entries, onRemove }) {
  return (
    <div className="panel reveal" style={{ padding: 0, display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0 }}>
      <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper-2)' }}>
        <div>
          <div className="eyebrow" style={{ opacity: 0.6 }}>// today</div>
          <div className="display" style={{ fontSize: 30 }}>the log</div>
        </div>
        <SFX rotate={-6} size={28} style={{ position: 'static' }} color="var(--red)">{entries.length > 0 ? 'BOOM!' : '...'}</SFX>
      </div>
      <div className="scroll" style={{ padding: 18 }}>
        {entries.length === 0 ? <EmptyState /> : (
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

function EmptyState() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '30px 10px', textAlign: 'center', position: 'relative' }}>
      <div style={{ transform: 'scale(0.85)' }}><BurnerArt ignited={false} size={160} /></div>
      <div className="display" style={{ fontSize: 40, marginTop: 14 }}>cold stove.</div>
      <div className="hand" style={{ fontSize: 22, opacity: 0.7, maxWidth: 360 }}>
        nothing logged yet. throw a log on the fire →
      </div>
      <SFX rotate={-12} size={48} top={20} right={40} color="var(--red)">silence...</SFX>
    </div>
  )
}

function EntryCard({ entry, burner, onRemove, index }) {
  const intensityBars = '█'.repeat(entry.intensity) + '░'.repeat(5 - entry.intensity)
  return (
    <div className="panel-sm slide-up" style={{ padding: 14, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, animationDelay: `${index * 0.04}s`, alignItems: 'start' }}>
      <div style={{ display: 'grid', placeItems: 'center', padding: 8, border: '3px solid var(--ink)', background: 'var(--paper-2)' }}>
        <BurnerArt ignited={true} size={56} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div className="display" style={{ fontSize: 22, color: 'var(--red)' }}>{burner?.label}</div>
          <div className="mono" style={{ fontSize: 10, opacity: 0.5 }}>
            {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 500, marginTop: 2 }}>{entry.action}</div>
        {entry.note && <div className="hand" style={{ fontSize: 20, marginTop: 4, lineHeight: 1.1, opacity: 0.85 }}>{entry.note}</div>}
        <div className="mono" style={{ fontSize: 12, marginTop: 8, letterSpacing: '0.15em', color: 'var(--red-deep)' }}>
          INTENSITY {intensityBars} {entry.intensity}/5
        </div>
      </div>
      <button className="btn ghost sm" onClick={onRemove} style={{ fontSize: 12, padding: '4px 10px' }} title="remove">✕</button>
    </div>
  )
}

function Composer({ chosenBurners, onAdd }) {
  const [burnerId, setBurnerId] = useState(chosenBurners[0]?.id || '')
  const [action, setAction] = useState('')
  const [note, setNote] = useState('')
  const [intensity, setIntensity] = useState(3)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!chosenBurners.find(b => b.id === burnerId)) {
      setBurnerId(chosenBurners[0]?.id || '')
    }
  }, [chosenBurners])

  const submit = () => {
    if (!action.trim() || !burnerId) return
    onAdd({ burnerId, action: action.trim(), note: note.trim(), intensity, day: todayKey() })
    setAction('')
    setNote('')
    setIntensity(3)
    inputRef.current?.focus()
  }

  return (
    <div className="panel reveal" style={{ padding: 0, display: 'grid', gridTemplateRows: 'auto 1fr auto', minHeight: 0, position: 'relative' }}>
      <HalftoneCorner corner="br" size={120} />

      <div style={{ padding: '16px 20px', borderBottom: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)' }}>
        <div className="eyebrow" style={{ opacity: 0.7 }}>// new entry</div>
        <div className="display" style={{ fontSize: 30 }}>FEED A FLAME</div>
      </div>

      <div className="scroll" style={{ padding: 20, display: 'grid', gap: 16, alignContent: 'start' }}>
        <div>
          <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 8 }}>tag the burner</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chosenBurners.length}, 1fr)`, gap: 10 }}>
            {chosenBurners.map(b => {
              const active = b.id === burnerId
              return (
                <button
                  key={b.id}
                  onClick={() => setBurnerId(b.id)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    border: '3px solid var(--ink)',
                    boxShadow: active ? '4px 4px 0 0 var(--ink)' : '2px 2px 0 0 var(--ink)',
                    background: active ? 'var(--red)' : 'var(--paper)',
                    color: active ? 'var(--paper)' : 'var(--ink)',
                    padding: '12px 14px', transition: 'all 180ms',
                    transform: active ? 'translate(-2px,-2px)' : 'translate(0,0)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <BurnerArt ignited={active} size={36} />
                  <div style={{ display: 'grid' }}>
                    <span className="display" style={{ fontSize: 20, lineHeight: 1 }}>{b.label}</span>
                    <span className="mono" style={{ fontSize: 10, opacity: 0.7 }}>{b.kana}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 8 }}>what did you do?</div>
          <input
            ref={inputRef}
            className="ink-input"
            placeholder="e.g. 90 min deep work on the pitch deck"
            value={action}
            onChange={e => setAction(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          />
        </div>

        <div>
          <div className="eyebrow" style={{ opacity: 0.6, marginBottom: 8 }}>note <span style={{ opacity: 0.5 }}>(optional)</span></div>
          <textarea
            className="ink-input"
            placeholder="how did it feel?"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div className="eyebrow" style={{ opacity: 0.6 }}>intensity</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--red-deep)', letterSpacing: '0.15em' }}>
              {'█'.repeat(intensity)}{'░'.repeat(5 - intensity)} {intensity}/5
            </div>
          </div>
          <input className="ink" type="range" min={1} max={5} step={1} value={intensity} onChange={e => setIntensity(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ padding: 18, borderTop: '3px solid var(--ink)', background: 'var(--paper-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 11, opacity: 0.55 }}>⌘ + ↵ to submit</span>
        <button className="btn red" disabled={!action.trim()} onClick={submit}>LOG IT ▸</button>
      </div>
    </div>
  )
}

function WeekStrip({ entries, chosenBurners }) {
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
    <div className="panel-sm reveal" style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
      <div>
        <div className="eyebrow" style={{ opacity: 0.6 }}>// the season</div>
        <div className="display" style={{ fontSize: 22 }}>past 7 days</div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {chosenBurners.map(b => (
          <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '110px repeat(7, 1fr)', gap: 6, alignItems: 'center' }}>
            <div className="display" style={{ fontSize: 16, color: 'var(--red)' }}>{b.label}</div>
            {days.map((d, idx) => {
              const k = d.toISOString().slice(0, 10)
              const heat = cellHeat(k, b.id)
              const alpha = heat === 0 ? 0 : 0.25 + (heat / 12) * 0.75
              return (
                <div key={k} style={{
                  border: '2px solid var(--ink)', height: 30,
                  background: heat === 0 ? 'var(--paper)' : `oklch(0.58 0.20 28 / ${alpha})`,
                  display: 'grid', placeItems: 'center',
                }}>
                  <div className="mono" style={{ fontSize: 9, opacity: 0.7, color: heat > 8 ? 'var(--paper)' : 'var(--ink)' }}>{dayLabel(d, idx)}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

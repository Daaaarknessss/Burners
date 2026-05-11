import { useState, useEffect } from 'react'
import { BURNERS, BurnerArt, SFX, Bubble, HalftoneCorner } from './components'

export default function Onboarding({ onComplete }) {
  const [scene, setScene] = useState(0)
  const [picked, setPicked] = useState([])
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (scene === 0) {
      const t = setTimeout(() => setScene(1), 2400)
      return () => clearTimeout(t)
    }
  }, [scene])

  const togglePick = (id) => {
    setPicked(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 2) return prev
      return [...prev, id]
    })
  }

  const handleConfirm = () => {
    setClosing(true)
    setTimeout(() => onComplete(picked), 760)
  }

  return (
    <div className="stage paper-grain" style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 10%, rgba(10,10,10,0.05), transparent 50%), radial-gradient(ellipse at 80% 95%, rgba(10,10,10,0.06), transparent 55%)',
        pointerEvents: 'none',
      }} />

      {scene === 0 && <SceneIntro key="s0" />}
      {scene === 1 && <ScenePremise key="s1" onNext={() => setScene(2)} />}
      {scene === 2 && <SceneRule key="s2" onNext={() => setScene(3)} />}
      {scene === 3 && <ScenePick key="s3" picked={picked} togglePick={togglePick} onNext={() => setScene(4)} />}
      {scene === 4 && <SceneConfirm key="s4" picked={picked} onBack={() => setScene(3)} onConfirm={handleConfirm} />}

      <div className={'wipe ' + (closing ? 'run' : '')} />
    </div>
  )
}

function SceneIntro() {
  return (
    <div className="stage" style={{ display: 'grid', placeItems: 'center', position: 'absolute', inset: 0 }}>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div className="eyebrow reveal" style={{ marginBottom: 18, opacity: 0.7 }}>chapter 01 — the four burners</div>
        <h1 className="display smash" style={{ fontSize: 'clamp(96px, 18vw, 240px)', margin: 0, lineHeight: 0.82 }}>
          BURN<span style={{ color: 'var(--red)' }}>ER</span>S
        </h1>
        <div className="mono reveal" style={{ marginTop: 14, fontSize: 13, letterSpacing: '0.3em', opacity: 0.6, animationDelay: '0.5s' }}>
          a daily log for the unbalanced life
        </div>
        <SFX rotate={-12} size={88} top={-40} left={-180}>DON!</SFX>
        <SFX rotate={10} size={64} bottom={-40} right={-150} color="var(--red)">GO–</SFX>
      </div>
      <div className="speed-lines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  )
}

function ScenePremise({ onNext }) {
  return (
    <div className="stage" style={{ position: 'absolute', inset: 0, padding: '6vh 6vw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="eyebrow slide-up" style={{ opacity: 0.6, animationDelay: '0.1s' }}>// premise</div>
      <h2 className="display slide-up" style={{ fontSize: 'clamp(40px, 6vw, 76px)', margin: '8px 0 28px', maxWidth: 1100, animationDelay: '0.18s' }}>
        Imagine your life is a stove<br />with <span style={{ color: 'var(--red)' }}>four burners.</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1200 }}>
        {BURNERS.map((b, i) => (
          <div key={b.id} className="panel panel-pop" style={{ padding: 18, animationDelay: `${0.35 + i * 0.12}s` }}>
            <HalftoneCorner corner="tr" size={70} />
            <div className="eyebrow" style={{ opacity: 0.6 }}>burner 0{i + 1}</div>
            <div className="display" style={{ fontSize: 38, marginTop: 6 }}>{b.label}</div>
            <div className="mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{b.kana}</div>
            <div style={{ marginTop: 14, display: 'grid', placeItems: 'center' }}>
              <BurnerArt ignited={false} size={130} />
            </div>
            <div className="hand" style={{ fontSize: 20, marginTop: 10, lineHeight: 1.15 }}>{b.blurb}</div>
          </div>
        ))}
      </div>

      <div className="slide-up" style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 16, animationDelay: '1s' }}>
        <button className="btn red" onClick={onNext}>Keep reading ▸</button>
        <span className="mono" style={{ opacity: 0.5, fontSize: 12 }}>or press [enter]</span>
      </div>
      <KeyHandler onEnter={onNext} />
    </div>
  )
}

function SceneRule({ onNext }) {
  return (
    <div className="stage" style={{ position: 'absolute', inset: 0, padding: '8vh 8vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div className="eyebrow slide-up" style={{ opacity: 0.6 }}>// the rule</div>
      <h2 className="display slide-up" style={{ fontSize: 'clamp(48px, 8vw, 108px)', margin: '6px 0 18px', maxWidth: 1200, animationDelay: '0.1s' }}>
        To be successful<br />
        you must <span style={{ color: 'var(--red)' }}>cut one burner.</span><br />
        To be <em style={{ fontStyle: 'italic' }}>really</em> successful —
        cut two.
      </h2>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end', marginTop: 24, flexWrap: 'wrap' }}>
        <Bubble className="slide-up" tailDir="bl" style={{ maxWidth: 360, animationDelay: '0.5s' }}>
          <div className="hand" style={{ fontSize: 26, lineHeight: 1.15 }}>
            Every choice has a cost.<br />
            Pick the two flames you want to feed —
            <span style={{ color: 'var(--red)' }}> this season.</span>
          </div>
        </Bubble>

        <div className="panel-sm slide-up" style={{ padding: '14px 18px', animationDelay: '0.7s' }}>
          <div className="eyebrow" style={{ opacity: 0.6 }}>recommended</div>
          <div className="display" style={{ fontSize: 28 }}>pick 2</div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.6 }}>max 2 · min 1</div>
        </div>
      </div>

      <button className="btn slide-up" onClick={onNext} style={{ marginTop: 40, animationDelay: '1s' }}>
        Show me the burners ▸
      </button>
      <SFX rotate={-8} size={90} top="6vh" right="8vw" color="var(--red)">CHOOSE.</SFX>
      <KeyHandler onEnter={onNext} />
    </div>
  )
}

function ScenePick({ picked, togglePick, onNext }) {
  const canContinue = picked.length >= 1
  const isFull = picked.length >= 2

  return (
    <div className="stage" style={{ position: 'absolute', inset: 0, padding: '5vh 5vw', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow slide-up" style={{ opacity: 0.6 }}>// step 03 — ignite</div>
          <h2 className="display slide-up" style={{ fontSize: 'clamp(40px, 6vw, 72px)', margin: '6px 0 0', animationDelay: '0.08s' }}>
            Tap to <span style={{ color: 'var(--red)' }}>ignite.</span>
          </h2>
          <div className="mono slide-up" style={{ opacity: 0.55, fontSize: 13, marginTop: 8, animationDelay: '0.15s' }}>
            tap once to light · tap again to extinguish · maximum 2
          </div>
        </div>
        <div className="panel-sm slide-up" style={{ padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', animationDelay: '0.22s' }}>
          <div className="eyebrow" style={{ opacity: 0.6 }}>lit</div>
          <div className="display" style={{ fontSize: 36, color: isFull ? 'var(--red)' : 'var(--ink)' }}>{picked.length}/2</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22, marginTop: 28, minHeight: 0 }}>
        {BURNERS.map((b, i) => (
          <BurnerCard
            key={b.id}
            burner={b}
            index={i}
            lit={picked.includes(b.id)}
            disabled={!picked.includes(b.id) && isFull}
            onClick={() => togglePick(b.id)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
        <div className="hand" style={{ fontSize: 22, opacity: 0.7 }}>
          {picked.length === 0 && '...waiting on you.'}
          {picked.length === 1 && 'one flame burning. recommended: light one more.'}
          {picked.length === 2 && <>two flames burning. <span style={{ color: 'var(--red)' }}>good. continue.</span></>}
        </div>
        <button className="btn red" onClick={onNext} disabled={!canContinue}>Review ▸</button>
      </div>
    </div>
  )
}

function BurnerCard({ burner, index, lit, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="panel-pop"
      style={{
        all: 'unset',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: lit ? 'var(--paper)' : 'var(--paper-2)',
        border: '4px solid var(--ink)',
        boxShadow: lit ? '10px 10px 0 0 var(--ink)' : '6px 6px 0 0 var(--ink)',
        padding: 18,
        position: 'relative',
        transition: 'transform 280ms cubic-bezier(.2,.7,.2,1), box-shadow 280ms, background 280ms',
        transform: lit ? 'translate(-3px,-3px)' : 'translate(0,0)',
        animationDelay: `${0.2 + index * 0.1}s`,
        display: 'flex', flexDirection: 'column',
        opacity: disabled ? 0.45 : 1,
        filter: disabled ? 'grayscale(0.4)' : 'none',
      }}
      onMouseEnter={(e) => { if (!disabled && !lit) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '8px 8px 0 0 var(--ink)' } }}
      onMouseLeave={(e) => { if (!disabled && !lit) { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '6px 6px 0 0 var(--ink)' } }}
    >
      <HalftoneCorner corner="tl" size={70} opacity={lit ? 0.65 : 0.35} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow" style={{ opacity: 0.6 }}>burner 0{index + 1}</div>
          <div className="display" style={{ fontSize: 42, marginTop: 4, color: lit ? 'var(--red)' : 'var(--ink)' }}>{burner.label}</div>
          <div className="mono" style={{ fontSize: 12, opacity: 0.55 }}>{burner.kana}</div>
        </div>
        <div className="display" style={{ fontSize: 14, padding: '4px 10px', border: '2px solid var(--ink)', background: lit ? 'var(--ink)' : 'transparent', color: lit ? 'var(--paper)' : 'var(--ink)' }}>
          {lit ? 'ON' : 'OFF'}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', placeItems: 'center', margin: '14px 0', position: 'relative', minHeight: 180 }}>
        <div style={{ animation: lit ? 'ignite 520ms cubic-bezier(.2,.7,.2,1)' : 'none' }}>
          <BurnerArt ignited={lit} size={210} />
        </div>
        {lit && <SFX rotate={-10} size={36} top={6} right={2} color="var(--red)">FWOOM</SFX>}
      </div>

      <div className="hand" style={{ fontSize: 20, lineHeight: 1.15 }}>{burner.blurb}</div>
    </button>
  )
}

function SceneConfirm({ picked, onBack, onConfirm }) {
  const chosen = BURNERS.filter(b => picked.includes(b.id))
  const cut = BURNERS.filter(b => !picked.includes(b.id))

  return (
    <div className="stage" style={{ position: 'absolute', inset: 0, padding: '6vh 6vw', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 22 }}>
      <div>
        <div className="eyebrow slide-up" style={{ opacity: 0.6 }}>// final panel</div>
        <h2 className="display slide-up" style={{ fontSize: 'clamp(40px, 6vw, 80px)', margin: '6px 0 0', animationDelay: '0.08s' }}>
          This is your <span style={{ color: 'var(--red)' }}>season.</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, minHeight: 0 }}>
        <div className="panel panel-pop" style={{ padding: 24, animationDelay: '0.15s' }}>
          <HalftoneCorner corner="tr" size={120} />
          <div className="eyebrow" style={{ opacity: 0.6 }}>burning</div>
          <div className="display" style={{ fontSize: 30, marginTop: 2 }}>your flames</div>
          <div style={{ display: 'grid', gridTemplateColumns: chosen.length === 1 ? '1fr' : '1fr 1fr', gap: 18, marginTop: 18 }}>
            {chosen.map((b) => (
              <div key={b.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <BurnerArt ignited={true} size={130} />
                <div>
                  <div className="display" style={{ fontSize: 36, color: 'var(--red)' }}>{b.label}</div>
                  <div className="mono" style={{ fontSize: 12, opacity: 0.6 }}>{b.kana}</div>
                  <div className="hand" style={{ fontSize: 20, marginTop: 4, lineHeight: 1.1 }}>{b.blurb}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-sm panel-pop" style={{ padding: 22, background: 'var(--paper-2)', animationDelay: '0.28s' }}>
          <div className="eyebrow" style={{ opacity: 0.6 }}>extinguished</div>
          <div className="display" style={{ fontSize: 26, marginTop: 2 }}>this season's cost</div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>// you can come back. just not now.</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            {cut.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '3px solid var(--ink)', background: 'var(--paper)', filter: 'grayscale(0.6)', opacity: 0.75 }}>
                <BurnerArt ignited={false} size={56} />
                <div style={{ flex: 1 }}>
                  <div className="display" style={{ fontSize: 22, textDecoration: 'line-through', textDecorationThickness: 3 }}>{b.label}</div>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.55 }}>{b.kana}</div>
                </div>
                <div className="eyebrow" style={{ opacity: 0.5 }}>off</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn ghost" onClick={onBack}>◂ change</button>
        <div className="hand" style={{ fontSize: 24, opacity: 0.75 }}>ready? this opens your daily log.</div>
        <button className="btn red" onClick={onConfirm}>Begin →</button>
      </div>

      <KeyHandler onEnter={onConfirm} />
    </div>
  )
}

function KeyHandler({ onEnter }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Enter') onEnter() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onEnter])
  return null
}

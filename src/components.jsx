export const BURNERS = [
  { id: 'family',  label: 'FAMILY',  kana: '家族', blurb: 'kin, partners, the ones at your table.',        hue: 18  },
  { id: 'friends', label: 'FRIENDS', kana: '友達', blurb: 'the chosen ones. people who fill the room.',    hue: 200 },
  { id: 'health',  label: 'HEALTH',  kana: '健康', blurb: 'body, breath, sleep, sweat.',                   hue: 140 },
  { id: 'work',    label: 'WORK',    kana: '仕事', blurb: 'craft, ambition, the long climb.',              hue: 50  },
]

// Top-down stove burner SVG with optional flames
export function BurnerArt({ ignited = false, size = 220 }) {
  return (
    <svg viewBox="0 0 240 240" width={size} height={size} className={ignited ? 'flicker' : ''} style={{ display: 'block' }}>
      <defs>
        <pattern id="halftone-flame" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.4" fill="#0a0a0a" />
        </pattern>
        <pattern id="halftone-coil" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.1" fill="#0a0a0a" />
        </pattern>
      </defs>

      {ignited && (
        <g opacity="0.7">
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2
            const x1 = 120 + Math.cos(a) * 118
            const y1 = 120 + Math.sin(a) * 118
            const x2 = 120 + Math.cos(a) * 138
            const y2 = 120 + Math.sin(a) * 138
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" />
          })}
        </g>
      )}

      <circle cx="120" cy="120" r="108" fill="none" stroke="#0a0a0a" strokeWidth="5" />
      <circle cx="120" cy="120" r="100" fill="none" stroke="#0a0a0a" strokeWidth="1.5" strokeDasharray="2 6" />

      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        const x1 = 120 + Math.cos(a) * 48
        const y1 = 120 + Math.sin(a) * 48
        const x2 = 120 + Math.cos(a) * 108
        const y2 = 120 + Math.sin(a) * 108
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" />
      })}

      <circle cx="120" cy="120" r="58" fill="#f6f3ec" stroke="#0a0a0a" strokeWidth="4" />
      <circle cx="120" cy="120" r="58" fill="url(#halftone-coil)" opacity={ignited ? 0.0 : 0.55} />
      <circle cx="120" cy="120" r="44" fill="none" stroke="#0a0a0a" strokeWidth="3" />
      <circle cx="120" cy="120" r="30" fill="none" stroke="#0a0a0a" strokeWidth="3" />
      <circle cx="120" cy="120" r="16" fill="#0a0a0a" />

      {ignited && (
        <g>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <g key={i} transform={`rotate(${deg} 120 120)`}>
              <path
                d="M120,52 C108,72 100,80 102,98 C104,112 116,118 120,128 C124,118 136,112 138,98 C140,80 132,72 120,52 Z"
                fill="oklch(0.58 0.20 28)" stroke="#0a0a0a" strokeWidth="3.5" strokeLinejoin="round"
              />
              <path
                d="M120,70 C113,84 109,88 110,98 C111,106 117,110 120,116 C123,110 129,106 130,98 C131,88 127,84 120,70 Z"
                fill="#f6f3ec" stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round"
              />
            </g>
          ))}
          {[30, 90, 150, 210, 270, 330].map((deg, i) => (
            <g key={i} transform={`rotate(${deg} 120 120)`}>
              <path d="M120,80 C114,92 112,96 114,104 C116,110 120,112 120,116 C120,112 124,110 126,104 C128,96 126,92 120,80 Z" fill="#0a0a0a" />
            </g>
          ))}
          <circle cx="120" cy="120" r="86" fill="none" stroke="url(#halftone-flame)" strokeWidth="14" opacity="0.35" />
        </g>
      )}

      {ignited && (
        <g>
          <circle cx="120" cy="120" r="6" fill="#f6f3ec" />
          <circle cx="120" cy="120" r="3" fill="oklch(0.58 0.20 28)" />
        </g>
      )}
    </svg>
  )
}

export function MiniFlame({ size = 20, lit = true }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
      <path
        d="M12 2 C10 6 7 8 7 13 a5 5 0 0 0 10 0 C17 9 14 7 12 2 Z"
        fill={lit ? 'oklch(0.58 0.20 28)' : '#f6f3ec'}
        stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round"
      />
      <path d="M12 9 C11 11 10 12 10 14 a2 2 0 0 0 4 0 C14 12 13 11 12 9 Z" fill="#0a0a0a" />
    </svg>
  )
}

export function SFX({ children, rotate = -6, size = 64, color = 'var(--ink)', top, left, right, bottom, style, className = '' }) {
  return (
    <div
      className={`display ${className}`}
      style={{
        position: 'absolute',
        top, left, right, bottom,
        transform: `rotate(${rotate}deg)`,
        fontSize: size,
        color,
        textShadow: '3px 3px 0 var(--paper), -3px -3px 0 var(--paper), 3px -3px 0 var(--paper), -3px 3px 0 var(--paper)',
        WebkitTextStroke: '2px var(--ink)',
        letterSpacing: '0.02em',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Bubble({ children, tailDir = 'bl', className = '', style }) {
  const tail = {
    bl: { left: 24, bottom: -18, transform: 'rotate(0)' },
    br: { right: 24, bottom: -18, transform: 'scaleX(-1)' },
    tl: { left: 24, top: -18, transform: 'scaleY(-1)' },
  }[tailDir] || {}
  return (
    <div className={'panel ' + className} style={{ background: 'var(--paper)', padding: '18px 22px', position: 'relative', ...style }}>
      {children}
      <svg viewBox="0 0 40 20" width="40" height="20" style={{ position: 'absolute', ...tail }}>
        <path d="M0 0 L40 0 L8 20 Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
        <rect x="0" y="0" width="40" height="2" fill="var(--paper)" />
      </svg>
    </div>
  )
}

export function HalftoneCorner({ corner = 'tr', size = 80, opacity = 0.55 }) {
  const pos = {
    tr: { top: 0, right: 0, transform: 'translate(20%,-20%)' },
    tl: { top: 0, left: 0, transform: 'translate(-20%,-20%)' },
    br: { bottom: 0, right: 0, transform: 'translate(20%,20%)' },
    bl: { bottom: 0, left: 0, transform: 'translate(-20%,20%)' },
  }[corner]
  return (
    <div
      className="halftone"
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: '50%',
        maskImage: 'radial-gradient(circle, black 40%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 70%)',
        opacity,
        pointerEvents: 'none',
        ...pos,
      }}
    />
  )
}

import type { SymbolId } from '../../engine/types'
import type { CSSProperties, ReactElement } from 'react'

const uid = (id: string, k: string) => `sym-${id}-${k}`

function Cherry() {
  const g = uid('cherry', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="체리">
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ff7b8a" />
          <stop offset="0.5" stopColor="#e5133a" />
          <stop offset="1" stopColor="#7a0018" />
        </radialGradient>
      </defs>
      <path d="M52 18 C 50 40, 34 48, 32 62" stroke="#3f7a2c" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M52 18 C 60 36, 68 46, 70 60" stroke="#3f7a2c" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M52 18 C 60 8, 76 8, 84 18 C 72 22, 62 22, 52 18Z" fill="#5fb542" />
      <circle cx="32" cy="70" r="18" fill={`url(#${g})`} />
      <circle cx="70" cy="66" r="18" fill={`url(#${g})`} />
      <ellipse cx="26" cy="62" rx="5" ry="3" fill="#fff" opacity="0.55" />
      <ellipse cx="64" cy="58" rx="5" ry="3" fill="#fff" opacity="0.55" />
    </svg>
  )
}

function Lemon() {
  const g = uid('lemon', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="레몬">
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff6a3" />
          <stop offset="0.5" stopColor="#ffd70a" />
          <stop offset="1" stopColor="#b98a00" />
        </radialGradient>
      </defs>
      <path d="M20 50 C 20 28, 40 20, 55 22 C 74 24, 84 36, 84 50 C 84 66, 70 78, 50 78 C 32 78, 20 66, 20 50Z" fill={`url(#${g})`} transform="rotate(-20 52 50)" />
      <path d="M84 48 l 8 -4 l -6 8Z" fill="#c9a000" transform="rotate(-20 52 50)" />
      <path d="M22 52 l -8 4 l 6 -8Z" fill="#c9a000" transform="rotate(-20 52 50)" />
      <path d="M36 26 C 40 20, 50 18, 56 24 C 50 26, 44 28, 36 26Z" fill="#5fb542" />
      <ellipse cx="38" cy="38" rx="9" ry="5" fill="#fff" opacity="0.4" transform="rotate(-20 38 38)" />
    </svg>
  )
}

function Orange() {
  const g = uid('orange', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="오렌지">
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="0.5" stopColor="#ff8c1a" />
          <stop offset="1" stopColor="#a84d00" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="56" r="32" fill={`url(#${g})`} />
      <g fill="#c96500" opacity="0.35">
        <circle cx="40" cy="62" r="1.6" /><circle cx="52" cy="70" r="1.6" /><circle cx="62" cy="58" r="1.6" />
        <circle cx="46" cy="48" r="1.6" /><circle cx="60" cy="72" r="1.6" /><circle cx="34" cy="50" r="1.6" />
      </g>
      <path d="M50 24 C 52 14, 62 10, 72 14 C 64 18, 58 22, 50 24Z" fill="#5fb542" />
      <rect x="48" y="20" width="4" height="8" rx="2" fill="#6b3e12" />
      <ellipse cx="38" cy="44" rx="8" ry="5" fill="#fff" opacity="0.4" />
    </svg>
  )
}

function Grape() {
  const g = uid('grape', 'g')
  const pts = [
    [50, 36], [38, 44], [62, 44], [30, 56], [50, 54], [70, 56], [40, 66], [60, 66], [50, 78],
  ]
  return (
    <svg viewBox="0 0 100 100" aria-label="포도">
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#c99bff" />
          <stop offset="0.5" stopColor="#7b3fd6" />
          <stop offset="1" stopColor="#3a1170" />
        </radialGradient>
      </defs>
      <path d="M50 30 C 50 22, 52 16, 56 12" stroke="#6b3e12" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M50 24 C 58 14, 74 14, 80 22 C 68 26, 58 28, 50 24Z" fill="#5fb542" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9.5" fill={`url(#${g})`} />
      ))}
      <ellipse cx="46" cy="33" rx="3" ry="2" fill="#fff" opacity="0.5" />
      <ellipse cx="34" cy="53" rx="3" ry="2" fill="#fff" opacity="0.5" />
    </svg>
  )
}

function Bell() {
  const g = uid('bell', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="벨">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset="0.4" stopColor="#ffc93c" />
          <stop offset="1" stopColor="#a86a00" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="16" r="5" fill="#a86a00" />
      <path d="M30 62 C 30 40, 36 24, 50 24 C 64 24, 70 40, 70 62 L 78 70 L 22 70 Z" fill={`url(#${g})`} stroke="#8a5600" strokeWidth="2" />
      <rect x="20" y="68" width="60" height="7" rx="3" fill="#8a5600" />
      <circle cx="50" cy="80" r="6" fill="#ffc93c" stroke="#8a5600" strokeWidth="2" />
      <path d="M40 34 C 42 28, 46 26, 50 26" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
    </svg>
  )
}

function Diamond() {
  const g = uid('diamond', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="다이아">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6fbff" />
          <stop offset="0.5" stopColor="#4fd6ff" />
          <stop offset="1" stopColor="#0a5c9a" />
        </linearGradient>
      </defs>
      <polygon points="50,88 12,42 28,20 72,20 88,42" fill={`url(#${g})`} stroke="#0a4a7a" strokeWidth="2" strokeLinejoin="round" />
      <g stroke="#fff" strokeWidth="1.5" opacity="0.7" fill="none">
        <polyline points="12,42 88,42" />
        <polyline points="28,20 40,42 50,88 60,42 72,20" />
        <polyline points="40,42 50,20 60,42" />
      </g>
      <polygon points="28,20 40,42 50,20" fill="#fff" opacity="0.35" />
    </svg>
  )
}

function Seven() {
  const g = uid('seven', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="세븐">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a8a" />
          <stop offset="0.5" stopColor="#e51b2e" />
          <stop offset="1" stopColor="#7a0012" />
        </linearGradient>
      </defs>
      <path d="M18 14 H 84 L 58 88 H 36 L 58 32 H 18 Z" fill={`url(#${g})`} stroke="#ffd76a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M24 20 H 76" stroke="#fff" strokeWidth="3" opacity="0.5" strokeLinecap="round" />
    </svg>
  )
}

function Wild() {
  const g = uid('wild', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="와일드">
      <defs>
        <radialGradient id={g} cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#fff7c2" />
          <stop offset="0.5" stopColor="#ffcf4a" />
          <stop offset="1" stopColor="#c77800" />
        </radialGradient>
      </defs>
      <polygon
        points="50,6 61,36 93,36 67,55 77,86 50,67 23,86 33,55 7,36 39,36"
        fill={`url(#${g})`}
        stroke="#8a5600"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="18" y="48" width="64" height="20" rx="4" fill="#1a1230" stroke="#ffcf4a" strokeWidth="2" />
      <text x="50" y="63" textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffcf4a" fontFamily="system-ui, sans-serif" letterSpacing="1">
        WILD
      </text>
    </svg>
  )
}

function Scatter() {
  const g = uid('scatter', 'g')
  return (
    <svg viewBox="0 0 100 100" aria-label="스캐터">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9ad5" />
          <stop offset="0.6" stopColor="#ff3cac" />
          <stop offset="1" stopColor="#8f0b5c" />
        </linearGradient>
      </defs>
      <rect x="16" y="40" width="68" height="46" rx="4" fill={`url(#${g})`} stroke="#5e0538" strokeWidth="2" />
      <rect x="12" y="30" width="76" height="16" rx="3" fill="#ff5fc0" stroke="#5e0538" strokeWidth="2" />
      <rect x="44" y="30" width="12" height="56" fill="#ffe36a" />
      <path d="M50 30 C 38 30, 30 22, 34 14 C 40 8, 48 18, 50 30 C 52 18, 60 8, 66 14 C 70 22, 62 30, 50 30Z" fill="#ffe36a" stroke="#b58a00" strokeWidth="2" />
      <rect x="22" y="60" width="56" height="16" rx="3" fill="#1a1230" opacity="0.85" />
      <text x="50" y="72" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#ffe36a" fontFamily="system-ui, sans-serif" letterSpacing="0.5">
        SCATTER
      </text>
    </svg>
  )
}

const MAP: Record<SymbolId, () => ReactElement> = {
  cherry: Cherry,
  lemon: Lemon,
  orange: Orange,
  grape: Grape,
  bell: Bell,
  diamond: Diamond,
  seven: Seven,
  wild: Wild,
  scatter: Scatter,
}

export function SymbolIcon({
  id,
  size = 64,
  className,
  style,
}: {
  id: SymbolId
  size?: number | string
  className?: string
  style?: CSSProperties
}) {
  const C = MAP[id]
  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0, verticalAlign: 'middle', ...style }}
    >
      <C />
    </span>
  )
}

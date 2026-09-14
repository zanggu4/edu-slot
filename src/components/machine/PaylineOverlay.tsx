import type { Cell } from '../../engine/types'
import { CELL_GAP, CELL_H, CELL_W } from './Reel'
import s from './machine.module.css'

export function cellCenter(c: Cell): { x: number; y: number } {
  return {
    x: c.reel * (CELL_W + CELL_GAP) + CELL_W / 2,
    y: c.row * (CELL_H + CELL_GAP) + CELL_H / 2,
  }
}

export function PaylineOverlay({ path, color = '#ffd76a' }: { path: Cell[] | null; color?: string }) {
  if (!path || path.length === 0) return null
  const pts = path.map(cellCenter)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const start = pts[0]
  const end = pts[pts.length - 1]
  return (
    <svg className={s.pathSvg} aria-hidden="true">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={d} stroke={color} strokeWidth="10" fill="none" opacity="0.28" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} stroke={color} strokeWidth="4" fill="none" filter="url(#glow)" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={start.x - CELL_W / 2 + 6} cy={start.y} r="5" fill={color} />
      <circle cx={end.x + CELL_W / 2 - 6} cy={end.y} r="5" fill={color} />
    </svg>
  )
}

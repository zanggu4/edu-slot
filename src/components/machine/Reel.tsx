import { useEffect, useRef } from 'react'
import type { SymbolId } from '../../engine/types'
import { SymbolIcon } from '../../assets/symbols'
import s from './machine.module.css'

export const CELL_W = 108
export const CELL_H = 100
export const CELL_GAP = 4
export const PITCH = CELL_H + CELL_GAP

interface ReelProps {
  index: number
  strip: SymbolId[]
  stop: number
  spinId: number
  stopDelayMs: number
  reducedMotion: boolean
  onStopped: (index: number) => void
}

const V_MAX = 22 // cells / s
const ACCEL = 90 // cells / s²
const STOP_MS = 420
const BOUNCE_MS = 170
const OVERSHOOT = 0.32 // cells

const easeOutQuad = (u: number) => 1 - (1 - u) * (1 - u)
const easeInOutSine = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2

export function Reel({ index, strip, stop, spinId, stopDelayMs, reducedMotion, onStopped }: ReelProps) {
  const colRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(stop)
  const onStoppedRef = useRef(onStopped)
  onStoppedRef.current = onStopped
  const len = strip.length

  // 렌더 위치 적용
  const apply = (pos: number, blur: boolean) => {
    const el = colRef.current
    if (!el) return
    let p = pos % len
    if (p < 0) p += len
    el.style.transform = `translate3d(0, ${-p * PITCH}px, 0)`
    el.classList.toggle(s.blur, blur)
  }

  useEffect(() => {
    if (spinId === 0) {
      posRef.current = stop
      apply(stop, false)
      return
    }
    let raf = 0
    const t0 = performance.now()
    let last = t0
    let phase: 'spin' | 'stop' | 'bounce' | 'done' = 'spin'
    let v = 0
    let p0 = 0
    let target = 0
    let phaseStart = 0
    let pos = posRef.current % len

    if (reducedMotion) {
      const id = window.setTimeout(() => {
        posRef.current = stop
        apply(stop, false)
        onStoppedRef.current(index)
      }, Math.min(stopDelayMs, 200 + index * 120))
      return () => window.clearTimeout(id)
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now - t0
      if (phase === 'spin') {
        v = Math.min(V_MAX, v + ACCEL * dt)
        pos += v * dt
        apply(pos, v > 10)
        if (t >= stopDelayMs) {
          phase = 'stop'
          phaseStart = now
          p0 = pos
          let tg = stop
          while (tg < pos + 3) tg += len
          target = tg
        }
      } else if (phase === 'stop') {
        const u = Math.min(1, (now - phaseStart) / STOP_MS)
        pos = p0 + (target + OVERSHOOT - p0) * easeOutQuad(u)
        apply(pos, u < 0.35)
        if (u >= 1) {
          phase = 'bounce'
          phaseStart = now
        }
      } else if (phase === 'bounce') {
        const u = Math.min(1, (now - phaseStart) / BOUNCE_MS)
        pos = target + OVERSHOOT * (1 - easeInOutSine(u))
        apply(pos, false)
        if (u >= 1) {
          phase = 'done'
          pos = stop
          posRef.current = stop
          apply(stop, false)
          onStoppedRef.current(index)
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId])

  // 스트립이 바뀌면(모드/프리스핀) 정지 상태에서 위치 재적용
  useEffect(() => {
    if (spinId === 0) apply(stop, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip, stop])

  const doubled = strip.concat(strip)
  return (
    <div className={s.reel}>
      <div ref={colRef} className={s.column}>
        {doubled.map((sym, i) => (
          <div key={i} className={s.cell}>
            <SymbolIcon id={sym} size={78} />
          </div>
        ))}
      </div>
    </div>
  )
}

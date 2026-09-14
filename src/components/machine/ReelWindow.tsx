import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, type Highlight } from '../../store/gameStore'
import { stripsFor } from '../../engine/reels'
import { REELS, ROWS, type Cell } from '../../engine/types'
import { Reel, CELL_GAP, CELL_H, CELL_W } from './Reel'
import { PaylineOverlay } from './PaylineOverlay'
import { sfx } from '../../audio/sfx'
import s from './machine.module.css'

const BASE_DELAY = 700
const STAGGER = 400

function usePrefersReducedMotion(): boolean {
  const [r, setR] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const h = () => setR(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return r
}

const key = (c: Cell) => `${c.reel}-${c.row}`

export function ReelWindow() {
  const stops = useGame((g) => g.stops)
  const spinId = useGame((g) => g.spinId)
  const spinning = useGame((g) => g.spinning)
  const stripMode = useGame((g) => g.spinStripMode)
  const wasFree = useGame((g) => g.spinWasFree)
  const settle = useGame((g) => g.settle)
  const explanation = useGame((g) => g.explanation)
  const evaluation = useGame((g) => g.evaluation)
  const hover = useGame((g) => g.hover)
  const reduced = usePrefersReducedMotion()

  const stripSet = stripsFor(stripMode)
  const strips = wasFree ? stripSet.free : stripSet.normal

  const stoppedRef = useRef(0)
  useEffect(() => {
    stoppedRef.current = 0
  }, [spinId])

  const onStopped = (i: number) => {
    sfx.reelStop(i)
    stoppedRef.current++
    if (stoppedRef.current >= REELS) {
      settle()
      const e = useGame.getState().evaluation
      if (e) {
        if (e.scatter.count >= 3) sfx.scatter()
        else if (e.totalWin > 0) {
          const ratio = e.totalWin / Math.max(1, e.totalBet)
          sfx.win(ratio >= 10 ? 'big' : ratio >= 2 ? 'mid' : 'small')
        } else sfx.lose()
      }
    }
  }

  // 당첨 항목 순환 (1초)
  const wins = explanation?.wins ?? []
  const [cycle, setCycle] = useState(0)
  useEffect(() => {
    setCycle(0)
    if (wins.length <= 1 || reduced) return
    const id = window.setInterval(() => setCycle((c) => (c + 1) % wins.length), 1000)
    return () => window.clearInterval(id)
  }, [explanation, wins.length, reduced])

  const active: Highlight | null = useMemo(() => {
    if (spinning) return null
    if (hover) return hover
    if (wins.length > 0) {
      const w = wins[cycle % wins.length]
      return { cells: w.highlight, path: w.path, wildCells: w.wildCells }
    }
    return null
  }, [spinning, hover, wins, cycle])

  const scatterBig = !spinning && evaluation && evaluation.scatter.count >= 3
  const scatterCells = new Set((!spinning && evaluation ? evaluation.scatter.cells : []).map(key))
  const hlSet = new Set((active?.cells ?? []).map(key))
  const wildSet = new Set((active?.wildCells ?? []).map(key))
  const dimming = !!active

  const cells: Cell[] = []
  for (let reel = 0; reel < REELS; reel++) for (let row = 0; row < ROWS; row++) cells.push({ reel, row })

  const winFrame = !spinning && !!evaluation && evaluation.totalWin > 0

  return (
    <div className={[s.window, winFrame ? s.windowWin : '', scatterBig ? s.windowScatter : ''].join(' ')}>
      <div className={s.reels}>
        {strips.map((strip, i) => (
          <Reel
            key={i}
            index={i}
            strip={strip}
            stop={stops[i]}
            spinId={spinId}
            stopDelayMs={BASE_DELAY + STAGGER * i}
            reducedMotion={reduced}
            onStopped={onStopped}
          />
        ))}
      </div>
      {[1, 2].map((r) => (
        <div key={r} className={s.rowLine} style={{ top: r * (CELL_H + CELL_GAP) - CELL_GAP }} />
      ))}
      <div className={s.glass} />
      <div className={s.overlay}>
        {cells.map((c) => {
          const k = key(c)
          const cls = [s.hlCell]
          if (hlSet.has(k)) cls.push(wildSet.has(k) ? s.hlWild : s.hlWin)
          else if (scatterBig && scatterCells.has(k) && !hover) cls.push(s.hlScatter)
          else if (dimming) cls.push(s.hlDim)
          return (
            <div
              key={k}
              className={cls.join(' ')}
              style={{ left: c.reel * (CELL_W + CELL_GAP), top: c.row * (CELL_H + CELL_GAP) }}
            />
          )
        })}
        <PaylineOverlay path={active?.path ?? null} />
      </div>
    </div>
  )
}

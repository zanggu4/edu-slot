import type { Grid, SymbolId } from './types'
import { REELS, ROWS } from './types'
import type { Rng } from './rng'

/** 릴별 심볼 가중치. 스트립은 이 가중치를 고르게 펼쳐서 만든다. */
export type WeightTable = Partial<Record<SymbolId, number>>

/**
 * 릴 5개의 가중치. 와일드는 릴 2,3,4(인덱스 1..3)에만.
 * 시뮬레이터(`pnpm sim`)로 RTP ≈ 94%, 스캐터 3개↑ ≈ 1/40 에 맞춰 튜닝한 값.
 */
export const REEL_WEIGHTS: WeightTable[] = [
  { cherry: 7, lemon: 7, orange: 6, grape: 5, bell: 4, diamond: 3, seven: 2, scatter: 2 },
  { cherry: 6, lemon: 6, orange: 6, grape: 5, bell: 4, diamond: 3, seven: 2, wild: 2, scatter: 2 },
  { cherry: 6, lemon: 6, orange: 5, grape: 5, bell: 4, diamond: 3, seven: 2, wild: 3, scatter: 2 },
  { cherry: 6, lemon: 6, orange: 6, grape: 5, bell: 4, diamond: 3, seven: 2, wild: 2, scatter: 2 },
  { cherry: 7, lemon: 7, orange: 6, grape: 5, bell: 4, diamond: 3, seven: 2, scatter: 2 },
]

/** 프리스핀 중 릴 2~4 와일드 가중치 배수 */
export const FREE_SPIN_WILD_MULTIPLIER = 2

/**
 * 가중치를 스트립으로 펼친다. 같은 심볼이 뭉치지 않게 smooth weighted round-robin으로 배치.
 * 결정적이므로 같은 가중치 → 항상 같은 스트립.
 */
export function buildStrip(weights: WeightTable): SymbolId[] {
  const entries = (Object.entries(weights) as [SymbolId, number][]).filter(([, w]) => w > 0)
  const total = entries.reduce((a, [, w]) => a + w, 0)
  const current = new Map<SymbolId, number>(entries.map(([id]) => [id, 0]))
  const strip: SymbolId[] = []
  for (let i = 0; i < total; i++) {
    let best: SymbolId | null = null
    let bestVal = -Infinity
    for (const [id, w] of entries) {
      const v = (current.get(id) ?? 0) + w
      current.set(id, v)
      if (v > bestVal) {
        bestVal = v
        best = id
      }
    }
    if (best === null) throw new Error('empty weights')
    current.set(best, (current.get(best) ?? 0) - total)
    strip.push(best)
  }
  return strip
}

function freeSpinWeights(weights: WeightTable, reelIndex: number): WeightTable {
  if (reelIndex < 1 || reelIndex > 3 || !weights.wild) return weights
  return { ...weights, wild: weights.wild * FREE_SPIN_WILD_MULTIPLIER }
}

export const STRIPS: SymbolId[][] = REEL_WEIGHTS.map(buildStrip)
export const FREE_SPIN_STRIPS: SymbolId[][] = REEL_WEIGHTS.map((w, i) =>
  buildStrip(freeSpinWeights(w, i)),
)

export interface SpinOptions {
  freeSpin?: boolean
}

/** 릴 정지 위치(각 릴의 스트립 인덱스) */
export type Stops = number[]

export function spinStops(rng: Rng, opts: SpinOptions = {}): Stops {
  const strips = opts.freeSpin ? FREE_SPIN_STRIPS : STRIPS
  return strips.map((strip) => Math.floor(rng() * strip.length))
}

export function gridFromStops(stops: Stops, opts: SpinOptions = {}): Grid {
  const strips = opts.freeSpin ? FREE_SPIN_STRIPS : STRIPS
  const grid: Grid = []
  for (let r = 0; r < REELS; r++) {
    const strip = strips[r]
    const col: SymbolId[] = []
    for (let row = 0; row < ROWS; row++) {
      col.push(strip[(stops[r] + row) % strip.length])
    }
    grid.push(col)
  }
  return grid
}

/** 스핀 한 번: 릴 결과 5×3 */
export function spin(rng: Rng, opts: SpinOptions = {}): Grid {
  return gridFromStops(spinStops(rng, opts), opts)
}

/** 테스트/설명용: 행 우선 표기로 그리드 생성. rows[row][reel] */
export function gridFromRows(rows: SymbolId[][]): Grid {
  const grid: Grid = []
  for (let r = 0; r < REELS; r++) {
    grid.push(rows.map((row) => row[r]))
  }
  return grid
}

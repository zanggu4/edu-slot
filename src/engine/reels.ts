import type { Grid, Mode, SymbolId } from './types'
import { REELS, ROWS } from './types'
import type { Rng } from './rng'

/** 릴별 심볼 가중치. 스트립은 이 가중치를 고르게 펼쳐서 만든다. */
export type WeightTable = Partial<Record<SymbolId, number>>

/**
 * 릴 5개의 가중치. 와일드는 릴 2,3,4(인덱스 1..3)에만.
 * 시뮬레이터(`pnpm sim`)로 RTP ≈ 94%, 스캐터 3개↑ ≈ 1/40 에 맞춰 튜닝한 값.
 */
export const REEL_WEIGHTS: WeightTable[] = [
  { cherry: 11, lemon: 8, orange: 7, grape: 5, bell: 4, diamond: 2, seven: 2, scatter: 2 },
  { cherry: 7, lemon: 8, orange: 8, grape: 7, bell: 3, diamond: 3, seven: 2, wild: 1, scatter: 2 },
  { cherry: 8, lemon: 8, orange: 7, grape: 5, bell: 4, diamond: 3, seven: 3, wild: 1, scatter: 2 },
  { cherry: 6, lemon: 8, orange: 6, grape: 8, bell: 4, diamond: 3, seven: 3, wild: 1, scatter: 2 },
  { cherry: 8, lemon: 9, orange: 7, grape: 4, bell: 4, diamond: 4, seven: 3, scatter: 2 },
]

/**
 * 웨이즈 모드 릴 가중치 (스트립 길이 61, 스캐터 3).
 * 같은 배당표로 243웨이를 판정하면 k개 일치 확률이 페이라인의 약 3^k 배가 되어
 * 같은 릴로는 환수율이 200%를 넘는다. 그래서 릴마다 주력 심볼을 엇갈리게(릴1·4: 체리/레몬,
 * 릴2·5: 오렌지/포도, 릴3: 벨/다이아) 두어 연속 일치를 드물게 만들었다. 실제 243웨이 기계는
 * 배당표 자체를 훨씬 낮게 잡는다.
 */
export const WAYS_REEL_WEIGHTS: WeightTable[] = [
  { cherry: 19, lemon: 19, orange: 9, grape: 3, bell: 2, diamond: 2, seven: 4, scatter: 3 },
  { cherry: 3, lemon: 3, orange: 22, grape: 18, bell: 4, diamond: 1, seven: 4, wild: 1, scatter: 3 },
  { cherry: 3, lemon: 3, orange: 3, grape: 7, bell: 21, diamond: 14, seven: 4, wild: 1, scatter: 3 },
  { cherry: 19, lemon: 19, orange: 3, grape: 4, bell: 3, diamond: 3, seven: 4, wild: 1, scatter: 3 },
  { cherry: 1, lemon: 2, orange: 22, grape: 11, bell: 7, diamond: 10, seven: 4, scatter: 3 },
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

export interface StripSet {
  normal: SymbolId[][]
  free: SymbolId[][]
}

export function makeStripSet(weights: WeightTable[]): StripSet {
  return {
    normal: weights.map(buildStrip),
    free: weights.map((w, i) => buildStrip(freeSpinWeights(w, i))),
  }
}

/** 페이라인 모드용 스트립 */
export const LINE_STRIPS: StripSet = makeStripSet(REEL_WEIGHTS)
/** 웨이즈 모드용 스트립 (같은 배당표로 243웨이는 훨씬 잘 맞으므로 릴을 따로 둔다) */
export const WAYS_STRIPS: StripSet = makeStripSet(WAYS_REEL_WEIGHTS)

export function stripsFor(mode: Mode): StripSet {
  return mode === 'ways' ? WAYS_STRIPS : LINE_STRIPS
}

export interface SpinOptions {
  freeSpin?: boolean
  /** 기본값: 페이라인 스트립 */
  strips?: StripSet
}

/** 릴 정지 위치(각 릴의 스트립 인덱스) */
export type Stops = number[]

function pick(opts: SpinOptions): SymbolId[][] {
  const set = opts.strips ?? LINE_STRIPS
  return opts.freeSpin ? set.free : set.normal
}

export function spinStops(rng: Rng, opts: SpinOptions = {}): Stops {
  return pick(opts).map((strip) => Math.floor(rng() * strip.length))
}

export function gridFromStops(stops: Stops, opts: SpinOptions = {}): Grid {
  const strips = pick(opts)
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

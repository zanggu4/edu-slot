import type { Grid, Mode, SymbolId } from './types'
import { REELS, ROWS } from './types'
import type { Rng } from './rng'

/** 릴별 심볼 가중치. 스트립은 이 가중치를 고르게 펼쳐서 만든다. */
export type WeightTable = Partial<Record<SymbolId, number>>

export type ProfileId = 'real' | 'edu'

export interface MachineProfile {
  id: ProfileId
  name: string
  /** 목표 환수율 (%) */
  rtp: number
  /** 프리스핀 진입 빈도 (1/N 판) */
  bonusEvery: number
  description: string
  lineWeights: WeightTable[]
  waysWeights: WeightTable[]
}

/**
 * 실제형: 지상 카지노 일반치를 참고한 튜닝. 환수율 약 90%, 프리스핀 약 1/150판.
 * 릴당 스캐터 1개, 스트립 32칸. 시뮬레이터(`pnpm sim --profile real`)로 맞춘 값.
 */
const REAL_LINE_WEIGHTS: WeightTable[] = [
  { cherry: 4, lemon: 5, orange: 7, grape: 5, bell: 4, diamond: 4, seven: 2, scatter: 1 },
  { cherry: 4, lemon: 6, orange: 4, grape: 6, bell: 4, diamond: 4, seven: 3, wild: 1, scatter: 1 },
  { cherry: 5, lemon: 4, orange: 4, grape: 7, bell: 4, diamond: 4, seven: 3, wild: 1, scatter: 1 },
  { cherry: 3, lemon: 6, orange: 3, grape: 13, bell: 3, diamond: 2, seven: 1, wild: 1, scatter: 1 },
  { cherry: 4, lemon: 4, orange: 6, grape: 9, bell: 4, diamond: 2, seven: 2, scatter: 1 },
]

const REAL_WAYS_WEIGHTS: WeightTable[] = [
  { cherry: 10, lemon: 10, orange: 5, grape: 2, bell: 1, diamond: 1, seven: 2, scatter: 1 },
  { cherry: 1, lemon: 2, orange: 11, grape: 10, bell: 2, diamond: 1, seven: 2, wild: 1, scatter: 1 },
  { cherry: 2, lemon: 2, orange: 3, grape: 4, bell: 11, diamond: 7, seven: 1, wild: 1, scatter: 1 },
  { cherry: 10, lemon: 11, orange: 2, grape: 2, bell: 1, diamond: 2, seven: 2, wild: 1, scatter: 1 },
  { cherry: 1, lemon: 3, orange: 11, grape: 4, bell: 4, diamond: 5, seven: 2, scatter: 1 },
]

/**
 * 교육용: 이벤트가 자주 나오도록 튜닝. 환수율 약 94%, 프리스핀 약 1/40판.
 * 릴당 스캐터 2개(웨이즈 3개), 스트립 41칸(웨이즈 61칸).
 */
const EDU_LINE_WEIGHTS: WeightTable[] = [
  { cherry: 11, lemon: 8, orange: 7, grape: 5, bell: 4, diamond: 2, seven: 2, scatter: 2 },
  { cherry: 7, lemon: 8, orange: 8, grape: 7, bell: 3, diamond: 3, seven: 2, wild: 1, scatter: 2 },
  { cherry: 8, lemon: 8, orange: 7, grape: 5, bell: 4, diamond: 3, seven: 3, wild: 1, scatter: 2 },
  { cherry: 6, lemon: 8, orange: 6, grape: 8, bell: 4, diamond: 3, seven: 3, wild: 1, scatter: 2 },
  { cherry: 8, lemon: 9, orange: 7, grape: 4, bell: 4, diamond: 4, seven: 3, scatter: 2 },
]

/**
 * 웨이즈 모드는 같은 배당표로 243웨이를 판정하면 k개 일치 확률이 페이라인의 약 3^k 배가 되어
 * 같은 릴로는 환수율이 200%를 넘는다. 그래서 릴마다 주력 심볼을 엇갈리게(릴1·4: 체리/레몬,
 * 릴2·5: 오렌지/포도, 릴3: 벨/다이아) 두어 연속 일치를 드물게 만들었다. 실제 243웨이 기계는
 * 배당표 자체를 훨씬 낮게 잡는다.
 */
const EDU_WAYS_WEIGHTS: WeightTable[] = [
  { cherry: 19, lemon: 19, orange: 9, grape: 3, bell: 2, diamond: 2, seven: 4, scatter: 3 },
  { cherry: 3, lemon: 3, orange: 22, grape: 18, bell: 4, diamond: 1, seven: 4, wild: 1, scatter: 3 },
  { cherry: 3, lemon: 3, orange: 3, grape: 7, bell: 21, diamond: 14, seven: 4, wild: 1, scatter: 3 },
  { cherry: 19, lemon: 19, orange: 3, grape: 4, bell: 3, diamond: 3, seven: 4, wild: 1, scatter: 3 },
  { cherry: 1, lemon: 2, orange: 22, grape: 11, bell: 7, diamond: 10, seven: 4, scatter: 3 },
]

export const PROFILES: Record<ProfileId, MachineProfile> = {
  real: {
    id: 'real',
    name: '실제형',
    rtp: 90,
    bonusEvery: 150,
    description: '지상 카지노 슬롯의 일반적인 수준. 환수율 약 90%, 프리스핀 약 150판에 1번.',
    lineWeights: REAL_LINE_WEIGHTS,
    waysWeights: REAL_WAYS_WEIGHTS,
  },
  edu: {
    id: 'edu',
    name: '교육용',
    rtp: 94,
    bonusEvery: 40,
    description: '규칙을 빨리 보기 위해 이벤트를 자주 나오게 조정. 환수율 약 94%, 프리스핀 약 40판에 1번.',
    lineWeights: EDU_LINE_WEIGHTS,
    waysWeights: EDU_WAYS_WEIGHTS,
  },
}

export const DEFAULT_PROFILE: ProfileId = 'real'

/** 호환용 별칭 (교육용 페이라인 가중치) */
export const REEL_WEIGHTS = EDU_LINE_WEIGHTS
export const WAYS_REEL_WEIGHTS = EDU_WAYS_WEIGHTS

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

const STRIP_SETS: Record<ProfileId, { lines: StripSet; ways: StripSet }> = {
  real: { lines: makeStripSet(PROFILES.real.lineWeights), ways: makeStripSet(PROFILES.real.waysWeights) },
  edu: { lines: makeStripSet(PROFILES.edu.lineWeights), ways: makeStripSet(PROFILES.edu.waysWeights) },
}

export function stripsFor(mode: Mode, profile: ProfileId = DEFAULT_PROFILE): StripSet {
  return STRIP_SETS[profile][mode]
}

/** 호환용: 교육용 페이라인 스트립 */
export const LINE_STRIPS: StripSet = STRIP_SETS.edu.lines

export interface SpinOptions {
  freeSpin?: boolean
  /** 기본값: 페이라인 스트립 */
  strips?: StripSet
}

/** 릴 정지 위치(각 릴의 스트립 인덱스) */
export type Stops = number[]

function pick(opts: SpinOptions): SymbolId[][] {
  const set = opts.strips ?? stripsFor('lines')
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

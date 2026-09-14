import type { SymbolId } from './types'

export interface SymbolDef {
  id: SymbolId
  /** 한국어 이름 (설명 문장용) */
  name: string
  /** 3/4/5개 배당 (라인당 베팅 1 기준). 스캐터는 총 베팅 기준 */
  pays: [number, number, number]
  /** 2개도 지급하는 경우 (체리만) */
  pay2?: number
  isWild?: boolean
  isScatter?: boolean
}

/** 낮은 것부터 순서. 배열 순서가 곧 심볼 등급 */
export const SYMBOLS: SymbolDef[] = [
  { id: 'cherry', name: '체리', pays: [5, 15, 50], pay2: 1 },
  { id: 'lemon', name: '레몬', pays: [5, 15, 50] },
  { id: 'orange', name: '오렌지', pays: [8, 25, 80] },
  { id: 'grape', name: '포도', pays: [10, 40, 120] },
  { id: 'bell', name: '벨', pays: [20, 80, 250] },
  { id: 'diamond', name: '다이아', pays: [40, 150, 500] },
  { id: 'seven', name: '세븐', pays: [100, 400, 1500] },
  { id: 'wild', name: '와일드', pays: [0, 0, 0], isWild: true },
  { id: 'scatter', name: '스캐터', pays: [2, 10, 50], isScatter: true },
]

export const SYMBOL_MAP: Record<SymbolId, SymbolDef> = Object.fromEntries(
  SYMBOLS.map((s) => [s.id, s]),
) as Record<SymbolId, SymbolDef>

/** 라인/웨이 당첨 대상 심볼 (와일드·스캐터 제외) */
export const PAYING_SYMBOLS: SymbolId[] = SYMBOLS.filter((s) => !s.isWild && !s.isScatter).map(
  (s) => s.id,
)

export function isWild(s: SymbolId): boolean {
  return s === 'wild'
}
export function isScatter(s: SymbolId): boolean {
  return s === 'scatter'
}

/** count개 이어졌을 때 배당표 값. 없으면 0 */
export function payFor(symbol: SymbolId, count: number): number {
  const def = SYMBOL_MAP[symbol]
  if (!def || def.isWild || def.isScatter) return 0
  if (count >= 5) return def.pays[2]
  if (count === 4) return def.pays[1]
  if (count === 3) return def.pays[0]
  if (count === 2 && def.pay2) return def.pay2
  return 0
}

export function scatterPayFor(count: number): number {
  const def = SYMBOL_MAP.scatter
  if (count >= 5) return def.pays[2]
  if (count === 4) return def.pays[1]
  if (count === 3) return def.pays[0]
  return 0
}

export const FREE_SPINS_ON_TRIGGER = 10
export const FREE_SPINS_ON_RETRIGGER = 5
export const FREE_SPIN_MULTIPLIER = 2
export const SCATTER_TRIGGER_COUNT = 3

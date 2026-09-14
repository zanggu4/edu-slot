/** 엔진 공용 타입. React 의존 없음. */

export type SymbolId =
  | 'cherry'
  | 'lemon'
  | 'orange'
  | 'grape'
  | 'bell'
  | 'diamond'
  | 'seven'
  | 'wild'
  | 'scatter'

export const REELS = 5
export const ROWS = 3
export const LINE_COUNT = 25
export const WAYS_DIVISOR = 25

/** grid[reel][row] — 릴 0..4, 행 0(위)..2(아래) */
export type Grid = SymbolId[][]

export interface Cell {
  reel: number
  row: number
}

export type Mode = 'lines' | 'ways'
export type LineCount = 1 | 5 | 10 | 25
export type BetPerLine = 1 | 2 | 5 | 10

export interface BetConfig {
  mode: Mode
  /** 페이라인 모드에서 활성 라인 수. 웨이즈 모드에서는 무시(항상 25로 환산) */
  lines: LineCount
  /** 라인당 베팅. 웨이즈 모드에서는 웨이당 베팅(= 총베팅 / 25) */
  betPerLine: BetPerLine
}

export function totalBet(bet: BetConfig): number {
  return bet.mode === 'lines' ? bet.lines * bet.betPerLine : WAYS_DIVISOR * bet.betPerLine
}

export type LineKind = 'win' | 'near' | 'none' | 'inactiveWin' | 'rightOnly'

export interface LineResult {
  /** 1-based 라인 번호 */
  lineNo: number
  active: boolean
  cells: Cell[]
  symbols: SymbolId[]
  /** 릴1 심볼(라인 판정 기준 심볼). 스캐터면 null */
  symbol: SymbolId | null
  /** 왼쪽부터 이어진 개수 (와일드 포함) */
  count: number
  /** 와일드가 대체한 릴 인덱스(0-based) */
  wildReels: number[]
  /** 끊긴 릴 인덱스(0-based). 5개 다 이어지면 null */
  brokenAt: number | null
  /** 배당표 값(라인당 베팅 1 기준). 미당첨 0 */
  basePay: number
  /** 실제 지급액(활성 라인일 때만). 배수 미적용 */
  payout: number
  /** 비활성 라인이었다면 놓친 금액 */
  missedPayout: number
  kind: LineKind
  /** 오른쪽에만 모인 경우: 어떤 심볼이 몇 개, 어느 릴부터 */
  rightCluster: { symbol: SymbolId; count: number; startReel: number } | null
}

export type WayKind = 'win' | 'near' | 'none'

export interface WayResult {
  symbol: SymbolId
  /** 릴별 해당 심볼+와일드 개수. 끊긴 릴 이후는 실제 개수(참고용) */
  countsPerReel: number[]
  /** 이어진 릴 수 (0..5) */
  reelsMatched: number
  ways: number
  brokenAt: number | null
  basePay: number
  /** 배수 미적용 지급액 */
  payout: number
  /** 이어진 릴 안의 매칭 셀 전부 */
  cells: Cell[]
  wildCells: Cell[]
  kind: WayKind
}

export interface ScatterResult {
  count: number
  cells: Cell[]
  basePay: number
  /** 총 베팅 × basePay */
  payout: number
  triggersFreeSpins: boolean
}

export interface FreeSpinState {
  remaining: number
  multiplier: number
  /** 이번 프리스핀 세션 누적 획득 */
  sessionWon: number
  /** 발동 시점 베팅 고정 */
  lockedBet: BetConfig
  /** 총 부여된 횟수 (재발동 포함) */
  totalAwarded: number
}

/** 한 판의 완전한 판정 결과 */
export interface SpinEvaluation {
  grid: Grid
  bet: BetConfig
  totalBet: number
  lines: LineResult[]
  ways: WayResult[]
  scatter: ScatterResult
  /** 라인 or 웨이 당첨 합 (모드에 따라) + 스캐터, 배수 미적용 */
  baseWin: number
  multiplier: number
  /** 배수 적용 후 최종 지급 */
  totalWin: number
  /** 이번 판에 실제로 낸 돈 (프리스핀이면 0) */
  paid: number
  isFreeSpin: boolean
}

import { create } from 'zustand'
import type {
  BetConfig,
  BetPerLine,
  Cell,
  FreeSpinState,
  Grid,
  LineCount,
  Mode,
  PaylineSetId,
  SpinEvaluation,
} from '../engine/types'
import { DEFAULT_PAYLINE_SET, getPaylineSet } from '../engine/paylines'
import { totalBet } from '../engine/types'
import { createRng, randomSeed, type Rng } from '../engine/rng'
import { DEFAULT_PROFILE, gridFromStops, spinStops, stripsFor, type ProfileId, type Stops } from '../engine/reels'
import { evaluateSpin } from '../engine/evaluate'
import { freeSpinsAwarded } from '../engine/scatter'
import { FREE_SPIN_MULTIPLIER } from '../engine/symbols'
import { DEFAULT_CONTEXT, explain, type ExplainContext, type Explanation } from '../engine/explain'

export type Denom = 10 | 100 | 1000
export const START_BALANCE = 1000

export interface Stats {
  spins: number
  paid: number
  won: number
  currentDry: number
  longestDry: number
  freeSpinSessions: number
}

export interface HistoryPoint {
  spin: number
  balance: number
}

export interface Highlight {
  cells: Cell[]
  path: Cell[] | null
  wildCells: Cell[]
  scatterCells?: Cell[]
}

export interface GameState {
  balance: number
  denom: Denom
  profile: ProfileId
  mode: Mode
  paylineSet: PaylineSetId
  lines: LineCount
  betPerLine: BetPerLine
  freeSpin: FreeSpinState | null

  spinId: number
  spinning: boolean
  stops: Stops
  grid: Grid | null
  pending: SpinEvaluation | null
  evaluation: SpinEvaluation | null
  explanation: Explanation | null
  lastCtx: ExplainContext
  /** 이번 판이 어느 스트립(모드/프리스핀)으로 돌았는지 — 릴 애니메이션용 */
  spinStripMode: Mode
  spinStripProfile: ProfileId
  spinWasFree: boolean

  stats: Stats
  history: HistoryPoint[]
  hasSpun: boolean
  seenScatterModal: boolean
  scatterModalOpen: boolean
  maxBetPending: boolean
  hover: Highlight | null
  muted: boolean
  lastWin: number

  setDenom: (d: Denom) => void
  setProfile: (p: ProfileId) => void
  setMode: (m: Mode) => void
  setPaylineSet: (id: PaylineSetId) => void
  setLines: (l: LineCount) => void
  setBetPerLine: (b: BetPerLine) => void
  maxBet: () => void
  startSpin: () => void
  settle: () => void
  reset: () => void
  setHover: (h: Highlight | null) => void
  closeScatterModal: () => void
  toggleMute: () => void
}

let rng: Rng = createRng(randomSeed())

/** 테스트/디버그용: 시드 고정 */
export function seedRng(seed: number) {
  rng = createRng(seed)
}

const initialStats = (): Stats => ({
  spins: 0,
  paid: 0,
  won: 0,
  currentDry: 0,
  longestDry: 0,
  freeSpinSessions: 0,
})

function loadProfile(): ProfileId {
  try {
    const v = localStorage.getItem('slot-profile')
    return v === 'edu' || v === 'real' ? v : DEFAULT_PROFILE
  } catch {
    return DEFAULT_PROFILE
  }
}

function loadPaylineSet(): PaylineSetId {
  try {
    const v = localStorage.getItem('slot-payline-set') as PaylineSetId | null
    if (v) getPaylineSet(v)
    return v ?? DEFAULT_PAYLINE_SET
  } catch {
    return DEFAULT_PAYLINE_SET
  }
}

function loadMuted(): boolean {
  try {
    return localStorage.getItem('slot-muted') === '1'
  } catch {
    return false
  }
}

export const useGame = create<GameState>((set, get) => ({
  balance: START_BALANCE,
  denom: 100,
  profile: loadProfile(),
  mode: 'lines',
  paylineSet: loadPaylineSet(),
  lines: getPaylineSet(loadPaylineSet()).lines.length,
  betPerLine: 1,
  freeSpin: null,

  spinId: 0,
  spinning: false,
  stops: [0, 0, 0, 0, 0],
  grid: null,
  pending: null,
  evaluation: null,
  explanation: null,
  lastCtx: DEFAULT_CONTEXT,
  spinStripMode: 'lines',
  spinStripProfile: loadProfile(),
  spinWasFree: false,

  stats: initialStats(),
  history: [{ spin: 0, balance: START_BALANCE }],
  hasSpun: false,
  seenScatterModal: false,
  scatterModalOpen: false,
  maxBetPending: false,
  hover: null,
  muted: loadMuted(),
  lastWin: 0,

  setDenom: (denom) => set({ denom }),

  setProfile: (profile) => {
    const s = get()
    if (s.spinning || s.freeSpin || s.profile === profile) return
    try {
      localStorage.setItem('slot-profile', profile)
    } catch {
      /* ignore */
    }
    set({ profile })
  },

  setMode: (mode) => {
    const s = get()
    if (s.spinning || s.freeSpin) return
    if (s.mode === mode) return
    const patch: Partial<GameState> = { mode }
    if (s.evaluation && s.grid) {
      const bet: BetConfig = { ...s.evaluation.bet, mode }
      const e = evaluateSpin(s.grid, bet, { isFreeSpin: s.evaluation.isFreeSpin })
      const ctx: ExplainContext = { ...s.lastCtx, maxBetPressed: false, modeSwitched: true }
      patch.evaluation = e
      patch.explanation = explain(e, ctx)
      patch.hover = null
    }
    set(patch)
  },

  setPaylineSet: (paylineSet) => {
    const s = get()
    if (s.spinning || s.freeSpin || s.paylineSet === paylineSet) return
    try {
      localStorage.setItem('slot-payline-set', paylineSet)
    } catch {
      /* ignore */
    }
    const plSet = getPaylineSet(paylineSet)
    const patch: Partial<GameState> = { paylineSet, lines: plSet.lines.length }
    if (s.evaluation && s.grid) {
      const bet: BetConfig = { ...s.evaluation.bet, paylineSet, lines: plSet.lines.length }
      const e = evaluateSpin(s.grid, bet, { isFreeSpin: s.evaluation.isFreeSpin })
      patch.evaluation = e
      patch.explanation = explain(e, { ...s.lastCtx, maxBetPressed: false, modeSwitched: true })
      patch.hover = null
    }
    set(patch)
  },

  setLines: (lines) => {
    const s = get()
    if (s.spinning || s.freeSpin) return
    set({ lines })
  },

  setBetPerLine: (betPerLine) => {
    const s = get()
    if (s.spinning || s.freeSpin) return
    set({ betPerLine })
  },

  maxBet: () => {
    const s = get()
    if (s.spinning || s.freeSpin) return
    set({ lines: getPaylineSet(s.paylineSet).lines.length, betPerLine: 10, maxBetPending: true })
    get().startSpin()
  },

  startSpin: () => {
    const s = get()
    if (s.spinning) return
    const fs = s.freeSpin
    const bet: BetConfig = fs
      ? fs.lockedBet
      : { mode: s.mode, lines: s.lines, betPerLine: s.betPerLine, paylineSet: s.paylineSet }
    const tb = totalBet(bet)
    const isFree = !!fs
    if (!isFree && s.balance < tb) return

    const strips = stripsFor(bet.mode, s.profile)
    const stops = spinStops(rng, { freeSpin: isFree, strips })
    const grid = gridFromStops(stops, { freeSpin: isFree, strips })
    const evaluation = evaluateSpin(grid, bet, { isFreeSpin: isFree })

    set({
      spinning: true,
      spinId: s.spinId + 1,
      stops,
      grid,
      pending: evaluation,
      explanation: null,
      hover: null,
      hasSpun: true,
      balance: isFree ? s.balance : s.balance - tb,
      freeSpin: fs ? { ...fs, remaining: fs.remaining - 1 } : null,
      spinStripMode: bet.mode,
      spinStripProfile: s.profile,
      spinWasFree: isFree,
      lastWin: 0,
    })
  },

  settle: () => {
    const s = get()
    const e = s.pending
    if (!e || !s.spinning) return

    let fs = s.freeSpin
    const wasFree = e.isFreeSpin
    const awarded = freeSpinsAwarded(e.scatter, wasFree)
    let ctxFree: ExplainContext['freeSpin'] = null
    let ended: ExplainContext['freeSpinsEnded'] = null
    const stats: Stats = { ...s.stats }

    if (wasFree && fs) {
      fs = {
        ...fs,
        remaining: fs.remaining + awarded,
        sessionWon: fs.sessionWon + e.totalWin,
        totalAwarded: fs.totalAwarded + awarded,
      }
      ctxFree = { remaining: fs.remaining, multiplier: fs.multiplier, sessionWon: fs.sessionWon }
      if (fs.remaining <= 0) {
        ended = { total: fs.totalAwarded, won: fs.sessionWon }
        fs = null
      }
    } else if (awarded > 0) {
      fs = {
        remaining: awarded,
        multiplier: FREE_SPIN_MULTIPLIER,
        sessionWon: 0,
        lockedBet: e.bet,
        totalAwarded: awarded,
      }
      stats.freeSpinSessions++
    }

    stats.spins++
    stats.paid += e.paid
    stats.won += e.totalWin
    if (e.totalWin === 0) {
      stats.currentDry++
      stats.longestDry = Math.max(stats.longestDry, stats.currentDry)
    } else {
      stats.currentDry = 0
    }

    const balance = s.balance + e.totalWin
    const ctx: ExplainContext = {
      freeSpin: ctxFree,
      freeSpinsAwarded: awarded,
      freeSpinsEnded: ended,
      maxBetPressed: s.maxBetPending,
      modeSwitched: false,
    }
    const openModal = !s.seenScatterModal && e.scatter.count >= 3

    set({
      spinning: false,
      pending: null,
      evaluation: e,
      explanation: explain(e, ctx),
      lastCtx: ctx,
      freeSpin: fs,
      balance,
      stats,
      history: [...s.history, { spin: stats.spins, balance }],
      maxBetPending: false,
      scatterModalOpen: openModal,
      seenScatterModal: s.seenScatterModal || openModal,
      lastWin: e.totalWin,
    })
  },

  reset: () =>
    set({
      balance: START_BALANCE,
      freeSpin: null,
      spinning: false,
      pending: null,
      evaluation: null,
      explanation: null,
      grid: null,
      stops: [0, 0, 0, 0, 0],
      lastCtx: DEFAULT_CONTEXT,
      stats: initialStats(),
      history: [{ spin: 0, balance: START_BALANCE }],
      hasSpun: false,
      maxBetPending: false,
      hover: null,
      lastWin: 0,
    }),

  setHover: (hover) => set({ hover }),
  closeScatterModal: () => set({ scatterModalOpen: false }),
  toggleMute: () => {
    const muted = !get().muted
    try {
      localStorage.setItem('slot-muted', muted ? '1' : '0')
    } catch {
      /* ignore */
    }
    set({ muted })
  },
}))

export function currentBet(
  s: Pick<GameState, 'freeSpin' | 'mode' | 'lines' | 'betPerLine' | 'paylineSet'>,
): BetConfig {
  return s.freeSpin
    ? s.freeSpin.lockedBet
    : { mode: s.mode, lines: s.lines, betPerLine: s.betPerLine, paylineSet: s.paylineSet }
}

export function formatWon(credits: number, denom: Denom): string {
  return `${(credits * denom).toLocaleString('ko-KR')}원`
}

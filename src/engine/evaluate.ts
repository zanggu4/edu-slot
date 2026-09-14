import type { BetConfig, Grid, SpinEvaluation } from './types'
import { totalBet } from './types'
import { evaluateLines, sumLineWins } from './evaluateLines'
import { evaluateWays, sumWayWins } from './evaluateWays'
import { evaluateScatter } from './scatter'
import { FREE_SPIN_MULTIPLIER } from './symbols'

export interface EvaluateOptions {
  isFreeSpin?: boolean
}

/** 릴 결과 하나를 두 방식 모두로 판정한다. 결정적. */
export function evaluateSpin(grid: Grid, bet: BetConfig, opts: EvaluateOptions = {}): SpinEvaluation {
  const isFreeSpin = !!opts.isFreeSpin
  const tb = totalBet(bet)
  const lines = evaluateLines(grid, bet)
  const ways = evaluateWays(grid, bet)
  const scatter = evaluateScatter(grid, tb)
  const modeWin = bet.mode === 'lines' ? sumLineWins(lines) : sumWayWins(ways)
  const baseWin = modeWin + scatter.payout
  const multiplier = isFreeSpin ? FREE_SPIN_MULTIPLIER : 1
  return {
    grid,
    bet,
    totalBet: tb,
    lines,
    ways,
    scatter,
    baseWin,
    multiplier,
    totalWin: baseWin * multiplier,
    paid: isFreeSpin ? 0 : tb,
    isFreeSpin,
  }
}

import type { Cell, Grid, ScatterResult } from './types'
import { REELS, ROWS } from './types'
import {
  FREE_SPINS_ON_RETRIGGER,
  FREE_SPINS_ON_TRIGGER,
  SCATTER_TRIGGER_COUNT,
  isScatter,
  scatterPayFor,
} from './symbols'

export function evaluateScatter(grid: Grid, totalBetAmount: number): ScatterResult {
  const cells: Cell[] = []
  for (let reel = 0; reel < REELS; reel++) {
    for (let row = 0; row < ROWS; row++) {
      if (isScatter(grid[reel][row])) cells.push({ reel, row })
    }
  }
  const count = cells.length
  const basePay = scatterPayFor(count)
  return {
    count,
    cells,
    basePay,
    payout: basePay * totalBetAmount,
    triggersFreeSpins: count >= SCATTER_TRIGGER_COUNT,
  }
}

/** 스캐터 결과로 부여되는 프리스핀 횟수. 프리스핀 중이면 재발동(+5). */
export function freeSpinsAwarded(scatter: ScatterResult, duringFreeSpins: boolean): number {
  if (!scatter.triggersFreeSpins) return 0
  return duringFreeSpins ? FREE_SPINS_ON_RETRIGGER : FREE_SPINS_ON_TRIGGER
}

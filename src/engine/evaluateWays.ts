import type { BetConfig, Cell, Grid, SymbolId, WayResult } from './types'
import { REELS, ROWS } from './types'
import { PAYING_SYMBOLS, isWild, payFor } from './symbols'

function evaluateOneSymbol(grid: Grid, symbol: SymbolId, betPerWay: number): WayResult {
  const countsPerReel: number[] = []
  const cells: Cell[] = []
  const wildCells: Cell[] = []
  let reelsMatched = 0
  let broken = false
  let brokenAt: number | null = null

  for (let reel = 0; reel < REELS; reel++) {
    let n = 0
    const reelCells: Cell[] = []
    const reelWild: Cell[] = []
    for (let row = 0; row < ROWS; row++) {
      const s = grid[reel][row]
      if (s === symbol) {
        n++
        reelCells.push({ reel, row })
      } else if (isWild(s)) {
        n++
        reelCells.push({ reel, row })
        reelWild.push({ reel, row })
      }
    }
    countsPerReel.push(n)
    if (!broken) {
      if (n === 0) {
        broken = true
        brokenAt = reel
      } else {
        reelsMatched++
        cells.push(...reelCells)
        wildCells.push(...reelWild)
      }
    }
  }

  const ways = reelsMatched === 0 ? 0 : countsPerReel.slice(0, reelsMatched).reduce((a, b) => a * b, 1)
  const basePay = payFor(symbol, reelsMatched)
  const payout = basePay * ways * betPerWay
  let kind: WayResult['kind'] = 'none'
  if (payout > 0) kind = 'win'
  else if (reelsMatched === 2) kind = 'near'

  return { symbol, countsPerReel, reelsMatched, ways, brokenAt, basePay, payout, cells, wildCells, kind }
}

/** 243 웨이즈 판정. 당첨 대상 심볼 7종 전부 반환(릴1에 없는 심볼은 reelsMatched 0). */
export function evaluateWays(grid: Grid, bet: BetConfig): WayResult[] {
  const betPerWay = bet.betPerLine
  return PAYING_SYMBOLS.map((s) => evaluateOneSymbol(grid, s, betPerWay))
}

export function sumWayWins(ways: WayResult[]): number {
  return ways.reduce((a, w) => a + w.payout, 0)
}

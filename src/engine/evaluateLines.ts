import type { BetConfig, Cell, Grid, LineResult, SymbolId } from './types'
import { REELS } from './types'
import { getPaylineSet } from './paylines'
import { isScatter, isWild, payFor } from './symbols'

function symbolsOnLine(grid: Grid, rows: readonly number[]): SymbolId[] {
  return rows.map((row, reel) => grid[reel][row])
}

/**
 * 릴 s부터 시작해 같은 심볼(와일드 포함)이 몇 개 이어지는지.
 * 기준 심볼은 시작 릴의 심볼. 와일드는 릴1(인덱스 0)에 없으므로 시작 심볼은 항상 실제 심볼.
 */
function runFrom(symbols: SymbolId[], start: number): { symbol: SymbolId | null; count: number; wildReels: number[] } {
  const base = symbols[start]
  if (isScatter(base) || isWild(base)) return { symbol: null, count: 0, wildReels: [] }
  let count = 0
  const wildReels: number[] = []
  for (let r = start; r < REELS; r++) {
    const s = symbols[r]
    if (s === base) count++
    else if (isWild(s)) {
      count++
      wildReels.push(r)
    } else break
  }
  return { symbol: base, count, wildReels }
}

function evaluateOneLine(grid: Grid, lineNo: number, bet: BetConfig, rows: readonly number[]): LineResult {
  const cells: Cell[] = rows.map((row, reel) => ({ reel, row }))
  const symbols = symbolsOnLine(grid, rows)
  const active = bet.mode === 'lines' ? lineNo <= bet.lines : true

  const run = runFrom(symbols, 0)
  const basePay = run.symbol ? payFor(run.symbol, run.count) : 0
  const brokenAt = run.count < REELS ? run.count : null

  let kind: LineResult['kind'] = 'none'
  let payout = 0
  let missedPayout = 0
  let rightCluster: LineResult['rightCluster'] = null

  if (basePay > 0) {
    if (active) {
      kind = 'win'
      payout = basePay * bet.betPerLine
    } else {
      kind = 'inactiveWin'
      missedPayout = basePay * bet.betPerLine
    }
  } else if (run.count === 2) {
    kind = 'near'
  } else {
    // 오른쪽에만 3개 이상 모인 경우 찾기 (릴2 또는 릴3부터 시작)
    for (let start = 1; start <= REELS - 3; start++) {
      const r = runFrom(symbols, start)
      if (r.symbol && r.count >= 3) {
        rightCluster = { symbol: r.symbol, count: r.count, startReel: start }
        kind = 'rightOnly'
        break
      }
    }
  }

  return {
    lineNo,
    active,
    cells,
    symbols,
    symbol: run.symbol,
    count: run.count,
    wildReels: run.wildReels,
    brokenAt,
    basePay,
    payout,
    missedPayout,
    kind,
    rightCluster,
  }
}

/** 세트의 라인 전부 판정. 활성/비활성 모두 포함. */
export function evaluateLines(grid: Grid, bet: BetConfig): LineResult[] {
  const set = getPaylineSet(bet.paylineSet)
  return set.lines.map((rows, i) => evaluateOneLine(grid, i + 1, bet, rows))
}

export function sumLineWins(lines: LineResult[]): number {
  return lines.reduce((a, l) => a + l.payout, 0)
}

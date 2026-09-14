/**
 * RTP 시뮬레이터. `pnpm sim [--spins N] [--seed S] [--mode lines|ways|both]`
 * 페이라인 25줄 × 라인당 1 (총 25), 웨이즈 총 25 기준. 프리스핀 포함.
 */
import { createRng } from './rng'
import { spin, stripsFor, type StripSet } from './reels'
import { evaluateLines, sumLineWins } from './evaluateLines'
import { evaluateWays, sumWayWins } from './evaluateWays'
import { evaluateScatter, freeSpinsAwarded } from './scatter'
import { FREE_SPIN_MULTIPLIER } from './symbols'
import type { BetConfig, Mode } from './types'
import { totalBet } from './types'

interface SimResult {
  mode: Mode
  spins: number
  paidSpins: number
  freeSpins: number
  totalPaid: number
  totalWon: number
  /** 일반(유료) 스핀에서의 라인/웨이 당첨 */
  baseLineWon: number
  /** 일반(유료) 스핀에서의 스캐터 당첨 */
  baseScatterWon: number
  /** 프리스핀 중 총 당첨(배수 포함) */
  freeSpinWon: number
  scatter3plus: number
  scatterByCount: number[]
  retriggers: number
  hits: number
  maxWin: number
  freeSessions: number
  freeSessionWonTotal: number
}

export function simulate(mode: Mode, spins: number, seed: number, strips: StripSet = stripsFor(mode)): SimResult {
  const rng = createRng(seed)
  const bet: BetConfig = { mode, lines: 25, betPerLine: 1 }
  const tb = totalBet(bet)
  const r: SimResult = {
    mode,
    spins: 0,
    paidSpins: 0,
    freeSpins: 0,
    totalPaid: 0,
    totalWon: 0,
    baseLineWon: 0,
    baseScatterWon: 0,
    freeSpinWon: 0,
    scatter3plus: 0,
    scatterByCount: [0, 0, 0, 0, 0, 0],
    retriggers: 0,
    hits: 0,
    maxWin: 0,
    freeSessions: 0,
    freeSessionWonTotal: 0,
  }

  let freeRemaining = 0
  let sessionWon = 0

  while (r.paidSpins < spins) {
    const isFree = freeRemaining > 0
    if (isFree) {
      freeRemaining--
      r.freeSpins++
    } else {
      r.paidSpins++
      r.totalPaid += tb
    }
    r.spins++

    const grid = spin(rng, { freeSpin: isFree, strips })
    const modeWin = mode === 'lines' ? sumLineWins(evaluateLines(grid, bet)) : sumWayWins(evaluateWays(grid, bet))
    const sc = evaluateScatter(grid, tb)
    const mult = isFree ? FREE_SPIN_MULTIPLIER : 1
    const win = (modeWin + sc.payout) * mult

    r.scatterByCount[Math.min(sc.count, 5)]++
    if (sc.count >= 3) r.scatter3plus++
    const awarded = freeSpinsAwarded(sc, isFree)
    if (awarded > 0) {
      if (isFree) r.retriggers++
      else {
        r.freeSessions++
        sessionWon = 0
      }
      freeRemaining += awarded
    }

    r.totalWon += win
    if (isFree) {
      r.freeSpinWon += win
      sessionWon += win
      if (freeRemaining === 0) r.freeSessionWonTotal += sessionWon
    } else {
      r.baseLineWon += modeWin
      r.baseScatterWon += sc.payout
    }
    if (win > 0) r.hits++
    if (win > r.maxWin) r.maxWin = win
  }
  return r
}

function pct(a: number, b: number): string {
  return ((a / b) * 100).toFixed(2) + '%'
}

export function report(r: SimResult, seed: number): string {
  const lines: string[] = []
  const tb = 25
  const perSession = r.freeSessionWonTotal / Math.max(1, r.freeSessions)
  lines.push(
    `=== ${r.mode === 'lines' ? '페이라인 25줄 × 라인당 1' : '웨이즈 총 베팅 25'} · 유료 ${r.paidSpins.toLocaleString()}판 + 프리스핀 ${r.freeSpins.toLocaleString()}판 · seed ${seed} ===`,
  )
  lines.push(`낸 돈 ${r.totalPaid.toLocaleString()} · 받은 돈 ${r.totalWon.toLocaleString()}`)
  lines.push(`RTP 전체         ${pct(r.totalWon, r.totalPaid)}`)
  lines.push(`  ├ 라인/웨이     ${pct(r.baseLineWon, r.totalPaid)} (일반 스핀)`)
  lines.push(`  ├ 스캐터        ${pct(r.baseScatterWon, r.totalPaid)} (일반 스핀)`)
  lines.push(`  └ 프리스핀 기여 ${pct(r.freeSpinWon, r.totalPaid)}`)
  lines.push(`히트 빈도        ${pct(r.hits, r.spins)} (당첨 0 초과인 판)`)
  lines.push(`프리스핀 진입    1 / ${(r.paidSpins / Math.max(1, r.freeSessions)).toFixed(1)} 판 (유료 판 기준)`)
  lines.push(`스캐터 3개↑      1 / ${(r.spins / Math.max(1, r.scatter3plus)).toFixed(1)} 판 (전체 판 기준)`)
  lines.push(
    `스캐터 분포      0:${r.scatterByCount[0]} 1:${r.scatterByCount[1]} 2:${r.scatterByCount[2]} 3:${r.scatterByCount[3]} 4:${r.scatterByCount[4]} 5:${r.scatterByCount[5]}`,
  )
  lines.push(
    `프리스핀 세션    ${r.freeSessions.toLocaleString()}회, 재발동 ${r.retriggers}회, 세션당 평균 획득 ${perSession.toFixed(1)} (총 베팅의 ${(perSession / tb).toFixed(1)}배)`,
  )
  lines.push(`최대 1판 당첨    ${r.maxWin.toLocaleString()}`)
  return lines.join('\n')
}

function parseArgs(argv: string[]) {
  const out: { spins: number; seed: number; mode: 'lines' | 'ways' | 'both' } = {
    spins: 1_000_000,
    seed: 20260914,
    mode: 'both',
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--spins') out.spins = Number(argv[++i])
    else if (a === '--seed') out.seed = Number(argv[++i])
    else if (a === '--mode') out.mode = argv[++i] as typeof out.mode
  }
  return out
}

const isMain = typeof process !== 'undefined' && process.argv[1] && /simulate\.ts$/.test(process.argv[1])
if (isMain) {
  const { spins, seed, mode } = parseArgs(process.argv.slice(2))
  const modes: Mode[] = mode === 'both' ? ['lines', 'ways'] : [mode]
  for (const m of modes) {
    const t0 = Date.now()
    const r = simulate(m, spins, seed)
    console.log(report(r, seed))
    console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)\n`)
  }
}

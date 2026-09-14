import { describe, expect, it } from 'vitest'
import { gridFromRows } from '../reels'
import { evaluateLines } from '../evaluateLines'
import { evaluateWays } from '../evaluateWays'
import { evaluateScatter, freeSpinsAwarded } from '../scatter'
import { evaluateSpin } from '../evaluate'
import type { BetConfig, SymbolId } from '../types'

const L: BetConfig = { mode: 'lines', lines: 25, betPerLine: 1 }
const W: BetConfig = { mode: 'ways', lines: 25, betPerLine: 1 }

const c: SymbolId = 'cherry'
const le: SymbolId = 'lemon'
const o: SymbolId = 'orange'
const g: SymbolId = 'grape'
const b: SymbolId = 'bell'
const d: SymbolId = 'diamond'
const s7: SymbolId = 'seven'
const w: SymbolId = 'wild'
const sc: SymbolId = 'scatter'

/** 가운데 줄(라인1)에 원하는 심볼, 나머지는 겹치지 않게 채움 */
function midRow(mid: SymbolId[]): ReturnType<typeof gridFromRows> {
  return gridFromRows([
    [o, g, b, d, s7],
    mid,
    [d, s7, o, g, b],
  ])
}

describe('evaluateLines', () => {
  it('왼쪽부터 연속 3개 → 3개 배당', () => {
    const r = evaluateLines(midRow([le, le, le, c, d]), L)[0]
    expect(r.kind).toBe('win')
    expect(r.symbol).toBe('lemon')
    expect(r.count).toBe(3)
    expect(r.brokenAt).toBe(3)
    expect(r.basePay).toBe(5)
    expect(r.payout).toBe(5)
  })

  it('와일드 대체: 🍋 🍋 ⭐ 🍋 🍒 → 4개, 와일드 위치 기록', () => {
    const r = evaluateLines(midRow([le, le, w, le, c]), L)[0]
    expect(r.count).toBe(4)
    expect(r.wildReels).toEqual([2])
    expect(r.basePay).toBe(15)
    expect(r.kind).toBe('win')
  })

  it('중간 끊김: 🍇 🍇 🍒 🍇 🍇 → 2개까지, 아까움', () => {
    const r = evaluateLines(midRow([g, g, c, g, g]), L)[0]
    expect(r.count).toBe(2)
    expect(r.kind).toBe('near')
    expect(r.payout).toBe(0)
    expect(r.brokenAt).toBe(2)
  })

  it('오른쪽에만 모임: 🍒 🍋 🍒 🍒 🍒 → 무효, rightCluster 기록', () => {
    const r = evaluateLines(midRow([c, le, c, c, c]), L)[0]
    expect(r.count).toBe(1)
    expect(r.payout).toBe(0)
    expect(r.kind).toBe('rightOnly')
    expect(r.rightCluster).toEqual({ symbol: 'cherry', count: 3, startReel: 2 })
  })

  it('비활성 라인 당첨 → inactiveWin + 놓친 금액', () => {
    const bet: BetConfig = { mode: 'lines', lines: 1, betPerLine: 2 }
    // 라인 2 = 위 가로줄
    const grid = gridFromRows([
      [o, o, o, g, c],
      [c, le, g, b, d],
      [d, s7, b, c, le],
    ])
    const rs = evaluateLines(grid, bet)
    expect(rs[1].active).toBe(false)
    expect(rs[1].kind).toBe('inactiveWin')
    expect(rs[1].payout).toBe(0)
    expect(rs[1].missedPayout).toBe(16) // 8 × 2
    expect(rs[0].active).toBe(true)
  })

  it('체리 2개는 1 지급, 다른 심볼 2개는 지급 없음', () => {
    const cherry = evaluateLines(midRow([c, c, le, g, b]), L)[0]
    expect(cherry.kind).toBe('win')
    expect(cherry.basePay).toBe(1)
    const lemon = evaluateLines(midRow([le, le, c, g, b]), L)[0]
    expect(lemon.kind).toBe('near')
    expect(lemon.basePay).toBe(0)
  })

  it('체리 + 와일드 2개도 체리 2개로 1 지급', () => {
    const r = evaluateLines(midRow([c, w, le, g, b]), L)[0]
    expect(r.count).toBe(2)
    expect(r.basePay).toBe(1)
  })

  it('한 라인은 최고 배당 하나만: 5개 연속이면 5개 배당만', () => {
    const r = evaluateLines(midRow([s7, s7, s7, s7, s7]), L)[0]
    expect(r.basePay).toBe(1500)
    expect(r.payout).toBe(1500)
  })

  it('라인당 베팅 배수 적용', () => {
    const bet: BetConfig = { mode: 'lines', lines: 25, betPerLine: 5 }
    const r = evaluateLines(midRow([b, b, b, c, d]), bet)[0]
    expect(r.payout).toBe(100) // 20 × 5
  })

  it('릴1이 스캐터면 라인 심볼 없음', () => {
    const r = evaluateLines(midRow([sc, le, le, le, le]), L)[0]
    expect(r.symbol).toBeNull()
    expect(r.count).toBe(0)
    expect(r.kind).toBe('rightOnly')
  })

  it('항상 25개 라인 반환', () => {
    expect(evaluateLines(midRow([c, le, o, g, b]), L)).toHaveLength(25)
  })
})

describe('evaluateWays', () => {
  it('웨이 수 곱셈: 릴1 2개 × 릴2 1개 × 릴3 2개 = 4웨이', () => {
    const grid = gridFromRows([
      [c, le, c, o, g],
      [c, c, w, le, b],
      [le, o, g, b, d],
    ])
    const r = evaluateWays(grid, W).find((x) => x.symbol === 'cherry')!
    expect(r.countsPerReel.slice(0, 3)).toEqual([2, 1, 2])
    expect(r.reelsMatched).toBe(3)
    expect(r.ways).toBe(4)
    expect(r.brokenAt).toBe(3)
    expect(r.basePay).toBe(5)
    expect(r.payout).toBe(20) // 4 × 1 × 5
    expect(r.wildCells).toEqual([{ reel: 2, row: 1 }])
    expect(r.kind).toBe('win')
  })

  it('릴1에 없는 심볼은 0웨이', () => {
    const grid = gridFromRows([
      [c, le, le, le, le],
      [c, le, le, le, le],
      [c, le, le, le, le],
    ])
    const lemon = evaluateWays(grid, W).find((x) => x.symbol === 'lemon')!
    expect(lemon.reelsMatched).toBe(0)
    expect(lemon.ways).toBe(0)
    expect(lemon.kind).toBe('none')
  })

  it('웨이당 베팅 = 총베팅/25 적용', () => {
    const bet: BetConfig = { mode: 'ways', lines: 25, betPerLine: 2 }
    const grid = gridFromRows([
      [b, b, b, c, c],
      [c, le, o, g, d],
      [le, o, g, d, s7],
    ])
    const r = evaluateWays(grid, bet).find((x) => x.symbol === 'bell')!
    expect(r.ways).toBe(1)
    expect(r.payout).toBe(40) // 1 × 2 × 20
  })

  it('웨이즈 2릴은 아까움', () => {
    const grid = gridFromRows([
      [g, g, c, c, c],
      [c, le, o, o, d],
      [le, o, b, d, s7],
    ])
    const r = evaluateWays(grid, W).find((x) => x.symbol === 'grape')!
    expect(r.reelsMatched).toBe(2)
    expect(r.kind).toBe('near')
  })
})

describe('scatter', () => {
  const base = [
    [c, le, o, g, b],
    [le, o, g, b, d],
    [o, g, b, d, s7],
  ]
  function withScatters(n: number) {
    const rows = base.map((r) => [...r])
    const spots: [number, number][] = [
      [0, 0],
      [1, 2],
      [2, 4],
      [0, 3],
      [2, 1],
    ]
    for (let i = 0; i < n; i++) rows[spots[i][0]][spots[i][1]] = sc
    return gridFromRows(rows)
  }

  it('2개는 지급 없음, 트리거 없음', () => {
    const r = evaluateScatter(withScatters(2), 25)
    expect(r.count).toBe(2)
    expect(r.payout).toBe(0)
    expect(r.triggersFreeSpins).toBe(false)
  })

  it('3개 → 총베팅 × 2, 프리스핀 10회', () => {
    const r = evaluateScatter(withScatters(3), 25)
    expect(r.count).toBe(3)
    expect(r.payout).toBe(50)
    expect(r.triggersFreeSpins).toBe(true)
    expect(freeSpinsAwarded(r, false)).toBe(10)
  })

  it('4개 → × 10', () => {
    expect(evaluateScatter(withScatters(4), 25).payout).toBe(250)
  })

  it('5개 → × 50', () => {
    expect(evaluateScatter(withScatters(5), 25).payout).toBe(1250)
  })

  it('프리스핀 중 재발동 → +5', () => {
    const r = evaluateScatter(withScatters(3), 25)
    expect(freeSpinsAwarded(r, true)).toBe(5)
  })
})

describe('evaluateSpin', () => {
  it('프리스핀이면 ×2, 낸 돈 0', () => {
    const grid = gridFromRows([
      [o, g, b, d, s7],
      [le, le, le, c, d],
      [d, s7, o, g, b],
    ])
    const e = evaluateSpin(grid, L, { isFreeSpin: true })
    expect(e.baseWin).toBe(5)
    expect(e.multiplier).toBe(2)
    expect(e.totalWin).toBe(10)
    expect(e.paid).toBe(0)
  })

  it('일반 스핀은 총베팅 차감', () => {
    const grid = gridFromRows([
      [o, g, b, d, s7],
      [le, le, le, c, d],
      [d, s7, o, g, b],
    ])
    const e = evaluateSpin(grid, L)
    expect(e.paid).toBe(25)
    expect(e.totalWin).toBe(5)
  })
})

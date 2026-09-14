import { describe, expect, it } from 'vitest'
import { gridFromRows } from '../reels'
import { evaluateSpin } from '../evaluate'
import { DEFAULT_CONTEXT, explain, toPlainText } from '../explain'
import type { BetConfig, SymbolId } from '../types'

const c: SymbolId = 'cherry'
const le: SymbolId = 'lemon'
const o: SymbolId = 'orange'
const g: SymbolId = 'grape'
const b: SymbolId = 'bell'
const d: SymbolId = 'diamond'
const s7: SymbolId = 'seven'
const w: SymbolId = 'wild'
const sc: SymbolId = 'scatter'

const L: BetConfig = { mode: 'lines', lines: 25, betPerLine: 2 }

describe('explain (lines)', () => {
  const grid = gridFromRows([
    [o, g, b, d, s7],
    [le, le, w, c, d],
    [b, s7, g, o, c],
  ])
  const ex = explain(evaluateSpin(grid, L))

  it('① 결론 한 줄 + 이겼는데 잃은 판 문구', () => {
    // 라인1: 🍋🍋⭐ = 5×2 = 10, 라인16: 🍋🍋🔔 near
    expect(ex.summary.paid).toBe(50)
    expect(ex.summary.won).toBe(10)
    expect(toPlainText(ex.summary.headline)).toBe('낸 돈 50 · 받은 돈 10 · 이번 판 -40')
    expect(toPlainText(ex.summary.notes[0])).toContain('이겼는데 잃은')
  })

  it('② 당첨 항목: 와일드 대체 문장 + 계산식', () => {
    expect(ex.wins).toHaveLength(1)
    const win = ex.wins[0]
    expect(toPlainText(win.title)).toBe('라인 1  ·  🍋 🍋 ⭐ 🍒 💎')
    const body = win.body.map(toPlainText)
    expect(body[0]).toBe('🍋 3개가 왼쪽부터 이어짐.')
    expect(body[1]).toBe('릴3은 ⭐ 와일드가 🍋 역할.')
    expect(body[2]).toBe('릴4가 🍒라서 여기서 끊김 → 3개 배당 적용.')
    expect(body[3]).toBe('라인당 베팅 2 × 배당 5 = 10')
    expect(win.highlight).toEqual([
      { reel: 0, row: 1 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
    ])
    expect(win.wildCells).toEqual([{ reel: 2, row: 1 }])
  })

  it('③ 아까운 항목: 3개였으면 금액', () => {
    const near = ex.nearMisses.find((n) => n.key === 'line-16')!
    expect(toPlainText(near.title)).toBe('라인 16  ·  🍋 🍋 🔔 🍒 💎')
    expect(toPlainText(near.body[0])).toBe('🍋 2개까지 이어졌는데 릴3에서 끊김. 3개였으면 10.')
    expect(toPlainText(near.body[1])).toBe('(체리가 아니면 2개는 지급 없음)')
  })

  it('④ 나머지 라인은 ②③ 제외 전부, 문구 존재', () => {
    expect(ex.wins.length + ex.nearMisses.length + ex.otherLines.length).toBe(25)
    for (const ol of ex.otherLines) expect(toPlainText(ol.note).length).toBeGreaterThan(0)
  })

  it('④ 비활성 라인 당첨 ⚠ + 놓친 금액', () => {
    const bet: BetConfig = { mode: 'lines', lines: 1, betPerLine: 2 }
    const grid2 = gridFromRows([
      [o, o, o, g, c],
      [c, le, g, b, d],
      [d, s7, b, c, le],
    ])
    const ex2 = explain(evaluateSpin(grid2, bet))
    const line2 = ex2.otherLines.find((l) => l.lineNo === 2)!
    expect(line2.warn).toBe(true)
    expect(toPlainText(line2.note)).toBe('⚠ 🍊 3개 연속인데 이 라인은 베팅하지 않아서 무효. 놓친 금액 16')
  })

  it('④ 오른쪽에만 모임 문구', () => {
    const grid3 = gridFromRows([
      [o, g, b, d, s7],
      [c, le, c, c, c],
      [b, s7, g, o, le],
    ])
    const ex3 = explain(evaluateSpin(grid3, L))
    const line1 = ex3.otherLines.find((l) => l.lineNo === 1)!
    expect(toPlainText(line1.note)).toBe(
      '릴1 🍒 다음 릴2에서 끊김 (🍒 3개가 릴3~5에 모여 있지만 왼쪽부터가 아니라 무효)',
    )
  })

  it('⑤ 스캐터 2개 문구', () => {
    const grid4 = gridFromRows([
      [sc, g, b, d, s7],
      [c, le, g, sc, c],
      [b, s7, o, o, le],
    ])
    const ex4 = explain(evaluateSpin(grid4, L))
    expect(toPlainText(ex4.special[0])).toBe(
      '🎁 2개 — 스캐터는 줄 상관없이 화면 어디든 3개면 프리스핀. 지금 1개 부족.',
    )
  })

  it('⑤ 스캐터 3개 + 프리스핀 진입', () => {
    const grid5 = gridFromRows([
      [sc, g, b, d, s7],
      [c, le, g, sc, c],
      [b, sc, o, o, le],
    ])
    const ex5 = explain(evaluateSpin(grid5, L), { ...DEFAULT_CONTEXT, freeSpinsAwarded: 10 })
    expect(toPlainText(ex5.special[0])).toBe('🎁 3개 — 스캐터(위치 상관없이 인정되는 그림) 배당: 총 베팅 50 × 2 = 100')
    expect(toPlainText(ex5.special[1])).toContain('프리스핀(공짜 판) 10회 진입')
  })

  it('① 프리스핀 중 문구 + ⑤ 배수 내역', () => {
    const ex6 = explain(evaluateSpin(grid, L, { isFreeSpin: true }), {
      ...DEFAULT_CONTEXT,
      freeSpin: { remaining: 7, multiplier: 2, sessionWon: 180 },
    })
    expect(toPlainText(ex6.summary.headline)).toBe('낸 돈 0 · 받은 돈 20 · 이번 판 +20')
    expect(toPlainText(ex6.summary.notes[0])).toBe('공짜 판 (남은 프리스핀 7, 배수 ×2 적용 중)')
    expect(ex6.special.map(toPlainText)).toContain('프리스핀 배수: 기본 당첨 10 + 스캐터 0 = 10 × 2 = 20')
    expect(ex6.special.map(toPlainText)).toContain('남은 프리스핀 7회. 이번 프리스핀 세션 누적 획득 180.')
  })

  it('⑤ 프리스핀 종료 + MAX BET 문구', () => {
    const ex7 = explain(evaluateSpin(grid, L), {
      ...DEFAULT_CONTEXT,
      freeSpinsEnded: { total: 10, won: 180 },
      maxBetPressed: true,
    })
    const texts = ex7.special.map(toPlainText)
    expect(texts[0]).toContain('라인 전부 + 최대 베팅으로 설정됨')
    expect(texts[texts.length - 1]).toBe(
      '프리스핀 10회 동안 총 180 획득. 이 보너스 확률도 기계 환수율에 이미 계산되어 있습니다.',
    )
  })

  it('모드 전환 안내', () => {
    const ex8 = explain(evaluateSpin(grid, { ...L, mode: 'ways' }), { ...DEFAULT_CONTEXT, modeSwitched: true })
    expect(toPlainText(ex8.summary.modeNote!)).toBe('방금 결과를 웨이즈로 보면:')
  })
})

describe('explain (ways)', () => {
  const W: BetConfig = { mode: 'ways', lines: 25, betPerLine: 1 }
  const grid = gridFromRows([
    [c, le, c, o, g],
    [c, c, w, le, b],
    [le, o, g, b, d],
  ])
  const ex = explain(evaluateSpin(grid, W))

  it('② 웨이 항목 계산식', () => {
    const win = ex.wins.find((x) => x.key === 'way-cherry')!
    expect(toPlainText(win.title)).toBe('🍒  ·  릴1 2개 × 릴2 1개 × 릴3 2개 = 4웨이')
    const body = win.body.map(toPlainText)
    expect(body[0]).toBe('릴4에 🍒도 ⭐도 없어서 3릴에서 끊김 → 3개 배당.')
    expect(body[1]).toBe('릴3의 1개는 ⭐ 와일드가 🍒 역할.')
    expect(body[2]).toBe('4웨이 × (웨이당 베팅 1 × 배당 5) = 20')
    expect(win.highlight).toHaveLength(5)
  })

  it('④ 릴1에 없는 심볼 문구', () => {
    const grape = ex.otherWays.find((x) => x.symbol === 'grape')!
    expect(toPlainText(grape.note)).toBe('🍇  ·  릴1에 없음 → 웨이는 릴1부터만 시작')
  })

  it('③ 웨이 아까움', () => {
    const grid2 = gridFromRows([
      [le, le, c, o, g],
      [c, le, o, o, b],
      [b, o, g, b, d],
    ])
    const ex2 = explain(evaluateSpin(grid2, W))
    const lemon = ex2.nearMisses.find((x) => x.key === 'way-lemon')!
    expect(toPlainText(lemon.title)).toBe('🍋  ·  릴1 1개 × 릴2 2개 = 2웨이')
    expect(toPlainText(lemon.body[0])).toBe('릴3에 🍋도 ⭐도 없어서 2릴에서 끊김. 3릴이었으면 2웨이 × 5 = 10.')
  })
})

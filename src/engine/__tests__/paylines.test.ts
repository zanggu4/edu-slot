import { describe, expect, it } from 'vitest'
import { PAYLINE_SETS, getPaylineSet, paylineCells } from '../paylines'
import { evaluateLines } from '../evaluateLines'
import { gridFromRows } from '../reels'

describe('payline sets', () => {
  it('모든 세트: 라인은 5칸, 행은 0~2, 세트 안에서 중복 없음, 이름과 개수 일치', () => {
    for (const set of PAYLINE_SETS) {
      const seen = new Set<string>()
      for (const line of set.lines) {
        expect(line).toHaveLength(5)
        for (const r of line) expect(r >= 0 && r <= 2).toBe(true)
        const k = line.join('')
        expect(seen.has(k)).toBe(false)
        seen.add(k)
      }
      expect(set.name.startsWith(String(set.lines.length))).toBe(true)
      expect(set.lineOptions[set.lineOptions.length - 1]).toBe(set.lines.length)
      expect(set.lines[0]).toEqual([1, 1, 1, 1, 1])
    }
  })

  it('세트별 라인 수만큼 판정 결과 반환', () => {
    const grid = gridFromRows([
      ['orange', 'grape', 'bell', 'diamond', 'seven'],
      ['lemon', 'lemon', 'lemon', 'cherry', 'diamond'],
      ['bell', 'seven', 'orange', 'grape', 'bell'],
    ])
    for (const set of PAYLINE_SETS) {
      const rs = evaluateLines(grid, { mode: 'lines', lines: set.lines.length, betPerLine: 1, paylineSet: set.id })
      expect(rs).toHaveLength(set.lines.length)
      expect(rs[0].kind).toBe('win') // 가운데 줄 🍋 3개
    }
  })

  it('9라인 세트의 라인 6은 위→아래 계단', () => {
    expect(getPaylineSet('novo9').lines[5]).toEqual([0, 0, 1, 2, 2])
    expect(paylineCells(6, 'novo9')[4]).toEqual({ reel: 4, row: 2 })
  })
})

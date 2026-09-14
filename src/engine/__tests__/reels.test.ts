import { describe, expect, it } from 'vitest'
import { FREE_SPIN_STRIPS, STRIPS, buildStrip, gridFromStops, spin } from '../reels'
import { createRng } from '../rng'

describe('reels', () => {
  it('가중치 합 = 스트립 길이, 심볼 개수 일치', () => {
    const strip = buildStrip({ cherry: 3, lemon: 2, wild: 1 })
    expect(strip).toHaveLength(6)
    expect(strip.filter((s) => s === 'cherry')).toHaveLength(3)
    expect(strip.filter((s) => s === 'wild')).toHaveLength(1)
  })

  it('와일드는 릴 2,3,4에만', () => {
    expect(STRIPS[0]).not.toContain('wild')
    expect(STRIPS[4]).not.toContain('wild')
    expect(STRIPS[1]).toContain('wild')
    expect(STRIPS[2]).toContain('wild')
    expect(STRIPS[3]).toContain('wild')
  })

  it('프리스핀 스트립은 릴 2~4 와일드 2배', () => {
    for (const r of [1, 2, 3]) {
      const n = STRIPS[r].filter((s) => s === 'wild').length
      const f = FREE_SPIN_STRIPS[r].filter((s) => s === 'wild').length
      expect(f).toBe(n * 2)
    }
    expect(FREE_SPIN_STRIPS[0]).toEqual(STRIPS[0])
  })

  it('같은 시드 → 같은 결과', () => {
    const a = spin(createRng(42))
    const b = spin(createRng(42))
    expect(a).toEqual(b)
    expect(a).toHaveLength(5)
    expect(a[0]).toHaveLength(3)
  })

  it('정지 위치가 스트립 끝이면 감아서 이어짐', () => {
    const len = STRIPS[0].length
    const g = gridFromStops([len - 1, 0, 0, 0, 0])
    expect(g[0]).toEqual([STRIPS[0][len - 1], STRIPS[0][0], STRIPS[0][1]])
  })
})

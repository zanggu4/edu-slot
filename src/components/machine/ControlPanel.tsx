import { useEffect, useRef, useState } from 'react'
import { useGame, currentBet, formatWon, type Denom } from '../../store/gameStore'
import { totalBet, type BetPerLine, type LineCount } from '../../engine/types'
import { sfx, setMuted } from '../../audio/sfx'
import s from './machine.module.css'

function useCountUp(target: number, active: boolean): number {
  const [v, setV] = useState(target)
  const raf = useRef(0)
  useEffect(() => {
    if (!active || target === 0) {
      setV(target)
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setV(target)
      return
    }
    const t0 = performance.now()
    const dur = Math.min(1800, 500 + target * 6)
    let lastTick = 0
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / dur)
      const cur = Math.round(target * (1 - Math.pow(1 - u, 3)))
      setV(cur)
      if (now - lastTick > 70 && u < 1) {
        sfx.coin()
        lastTick = now
      }
      if (u < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, active])
  return v
}

export function ControlPanel() {
  const g = useGame()
  const bet = currentBet(g)
  const tb = totalBet(bet)
  const locked = g.spinning || !!g.freeSpin
  const canSpin = !g.spinning && (!!g.freeSpin || g.balance >= tb)
  const shownWin = useCountUp(g.lastWin, !g.spinning)

  useEffect(() => {
    setMuted(g.muted)
  }, [g.muted])

  const seg = <T extends number>(
    values: readonly T[],
    cur: T,
    on: (v: T) => void,
    fmt: (v: T) => string = String,
    disabled = locked,
  ) => (
    <div className={s.seg}>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          className={[s.segBtn, v === cur ? s.segOn : ''].join(' ')}
          onClick={() => {
            sfx.click()
            on(v)
          }}
          disabled={disabled}
          aria-pressed={v === cur}
        >
          {fmt(v)}
        </button>
      ))}
    </div>
  )

  return (
    <div className={s.panel}>
      <div className={s.box}>
        <span className={s.label}>잔액 CREDITS</span>
        <span className={s.big}>{g.balance.toLocaleString('ko-KR')}</span>
        <span className={s.small}>{formatWon(g.balance, g.denom)}</span>
      </div>
      <div className={s.box}>
        <span className={s.label}>WIN 이번 판</span>
        <span className={[s.big, shownWin > 0 ? s.bigWin : ''].join(' ')}>{shownWin.toLocaleString('ko-KR')}</span>
        <span className={s.small}>{formatWon(shownWin, g.denom)}</span>
      </div>
      <div className={s.box}>
        <span className={s.label}>데노미 1크레딧 =</span>
        {seg<Denom>([10, 100, 1000], g.denom, g.setDenom, (v) => `${v.toLocaleString()}원`, g.spinning)}
        <span className={s.small}>표시 전용. 계산에는 영향 없음</span>
      </div>

      <div className={s.box}>
        <span className={s.label}>{bet.mode === 'lines' ? '라인당 베팅' : '웨이당 베팅 (= 총 베팅 ÷ 25)'}</span>
        {seg<BetPerLine>([1, 2, 5, 10], bet.betPerLine, g.setBetPerLine)}
      </div>
      <div className={s.box}>
        <span className={s.label}>{bet.mode === 'lines' ? '라인 수' : '웨이'}</span>
        {bet.mode === 'lines' ? (
          seg<LineCount>([1, 5, 10, 25], bet.lines, g.setLines)
        ) : (
          <div className={s.seg}>
            <button type="button" className={[s.segBtn, s.segOn].join(' ')} disabled>
              243 WAYS
            </button>
          </div>
        )}
      </div>
      <div className={s.box}>
        <span className={s.label}>총 베팅 {bet.mode === 'lines' ? `= ${bet.lines} × ${bet.betPerLine}` : `= 25 × ${bet.betPerLine}`}</span>
        <span className={s.big}>{tb.toLocaleString('ko-KR')}</span>
        <span className={s.small}>{formatWon(tb, g.denom)}{g.freeSpin ? ' · 프리스핀 중 차감 없음' : ''}</span>
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={[s.btn, s.ghost].join(' ')}
          onClick={() => {
            sfx.click()
            g.reset()
          }}
          disabled={g.spinning}
          title="잔액 1,000으로 되돌리고 통계를 지웁니다"
        >
          리셋
        </button>
        <button
          type="button"
          className={[s.btn, s.ghost].join(' ')}
          onClick={() => {
            sfx.unlock()
            g.toggleMute()
          }}
          aria-pressed={g.muted}
        >
          {g.muted ? '🔇 소리 끔' : '🔊 소리 켬'}
        </button>
        <button
          type="button"
          className={[s.btn, s.spin, g.freeSpin ? s.spinFree : ''].join(' ')}
          onClick={() => {
            sfx.unlock()
            sfx.spinStart()
            g.startSpin()
          }}
          disabled={!canSpin}
        >
          {g.freeSpin ? `FREE SPIN ${g.freeSpin.remaining}` : 'SPIN'}
        </button>
        <button
          type="button"
          className={[s.btn, s.maxbet].join(' ')}
          onClick={() => {
            sfx.unlock()
            sfx.spinStart()
            g.maxBet()
          }}
          disabled={locked || g.balance < 250}
          title="라인 25 + 라인당 10 으로 설정하고 바로 돌립니다 (총 250)"
        >
          MAX BET
        </button>
      </div>
    </div>
  )
}

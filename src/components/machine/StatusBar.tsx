import { useGame, currentBet } from '../../store/gameStore'
import { totalBet } from '../../engine/types'
import s from './machine.module.css'

export function StatusBar() {
  const freeSpin = useGame((g) => g.freeSpin)
  const balance = useGame((g) => g.balance)
  const mode = useGame((g) => g.mode)
  const lines = useGame((g) => g.lines)
  const betPerLine = useGame((g) => g.betPerLine)
  const spinning = useGame((g) => g.spinning)
  const tb = totalBet(currentBet({ freeSpin, mode, lines, betPerLine }))
  if (freeSpin) {
    return (
      <div className={[s.status, s.statusFree].join(' ')}>
        FREE SPINS {freeSpin.remaining} / ×{freeSpin.multiplier}
      </div>
    )
  }
  if (!spinning && balance < tb) {
    return <div className={[s.status, s.statusWarn].join(' ')}>잔액 {balance}이 총 베팅 {tb}보다 적습니다. 베팅을 줄이거나 리셋하세요.</div>
  }
  return <div className={s.status} aria-hidden="true" />
}

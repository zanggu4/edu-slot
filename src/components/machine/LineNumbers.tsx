import { useGame } from '../../store/gameStore'
import { getPaylineSet } from '../../engine/paylines'
import { ROWS } from '../../engine/types'
import s from './machine.module.css'

export function LineNumbers({ side }: { side: 'left' | 'right' }) {
  const mode = useGame((g) => g.mode)
  const lines = useGame((g) => g.lines)
  const freeSpin = useGame((g) => g.freeSpin)
  const hover = useGame((g) => g.hover)
  const paylineSet = useGame((g) => g.paylineSet)
  const PAYLINES = getPaylineSet(freeSpin ? freeSpin.lockedBet.paylineSet : paylineSet).lines
  const effMode = freeSpin ? freeSpin.lockedBet.mode : mode
  const effLines = freeSpin ? freeSpin.lockedBet.lines : lines
  const hoverLine = hover?.path ? PAYLINES.findIndex((rows) => rows.every((r, i) => hover.path![i]?.row === r)) + 1 : 0
  const col = side === 'left' ? 0 : 4
  return (
    <div className={s.lineNums} aria-label={`페이라인 번호 (${side === 'left' ? '왼쪽' : '오른쪽'})`}>
      {Array.from({ length: ROWS }, (_, row) => (
        <div key={row} className={s.lineRow}>
          {PAYLINES.map((rows, i) => {
            if (rows[col] !== row) return null
            const n = i + 1
            const on = effMode === 'lines' && n <= effLines
            const cls = [s.chip, on ? s.chipOn : '', hoverLine === n ? s.chipHover : ''].join(' ')
            return (
              <span key={n} className={cls} title={`라인 ${n}${on ? ' (활성)' : ' (비활성)'}`}>
                {n}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

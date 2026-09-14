import { useGame } from '../../store/gameStore'
import { ModeTabs } from './ModeTabs'
import { ReelWindow } from './ReelWindow'
import { LineNumbers } from './LineNumbers'
import { ControlPanel } from './ControlPanel'
import { StatusBar } from './StatusBar'
import s from './machine.module.css'

export function Cabinet() {
  const evaluation = useGame((g) => g.evaluation)
  const spinning = useGame((g) => g.spinning)
  const win = !spinning && !!evaluation && evaluation.totalWin > 0
  return (
    <div className={s.cabinet}>
      <div className={s.marquee}>
        <div>
          <div className={s.title}>LUCKY LEARN 5</div>
          <div className={s.subtitle}>교육용 · 가상 크레딧 · 환수율 약 94%</div>
        </div>
        <div className={[s.lamps, win ? s.lampsWin : ''].join(' ')} aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className={[s.lamp, i % 2 === 0 ? s.lampOn : ''].join(' ')} />
          ))}
        </div>
      </div>
      <ModeTabs />
      <div className={s.reelArea}>
        <LineNumbers side="left" />
        <ReelWindow />
        <LineNumbers side="right" />
      </div>
      <ControlPanel />
      <StatusBar />
    </div>
  )
}

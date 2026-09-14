import { useGame } from '../../store/gameStore'
import { PROFILES, type ProfileId } from '../../engine/reels'
import { sfx } from '../../audio/sfx'
import { ModeTabs } from './ModeTabs'
import { ReelWindow } from './ReelWindow'
import { LineNumbers } from './LineNumbers'
import { ControlPanel } from './ControlPanel'
import { StatusBar } from './StatusBar'
import s from './machine.module.css'

export function Cabinet() {
  const evaluation = useGame((g) => g.evaluation)
  const spinning = useGame((g) => g.spinning)
  const profile = useGame((g) => g.profile)
  const setProfile = useGame((g) => g.setProfile)
  const freeSpin = useGame((g) => g.freeSpin)
  const pf = PROFILES[profile]
  const locked = spinning || !!freeSpin
  const win = !spinning && !!evaluation && evaluation.totalWin > 0
  return (
    <div className={s.cabinet}>
      <div className={s.marquee}>
        <div>
          <div className={s.title}>LUCKY LEARN 5</div>
          <div className={s.subtitle}>가상 크레딧 · {pf.name} 설정 · 환수율 약 {pf.rtp}% · 프리스핀 약 1/{pf.bonusEvery}판</div>
        </div>
        <div className={s.marqueeRight}>
          <div className={[s.lamps, win ? s.lampsWin : ''].join(' ')} aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className={[s.lamp, i % 2 === 0 ? s.lampOn : ''].join(' ')} />
            ))}
          </div>
          <div className={s.profileSwitch} role="group" aria-label="기계 설정">
            {(Object.keys(PROFILES) as ProfileId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={[s.profileBtn, profile === id ? s.profileOn : ''].join(' ')}
                onClick={() => {
                  sfx.click()
                  setProfile(id)
                }}
                disabled={locked}
                aria-pressed={profile === id}
                title={PROFILES[id].description}
              >
                {PROFILES[id].name} {PROFILES[id].rtp}%
              </button>
            ))}
          </div>
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

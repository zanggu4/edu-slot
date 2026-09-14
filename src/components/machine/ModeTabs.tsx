import { useGame } from '../../store/gameStore'
import { PROFILES, type ProfileId } from '../../engine/reels'
import { sfx } from '../../audio/sfx'
import s from './machine.module.css'

export function ModeTabs() {
  const mode = useGame((g) => g.mode)
  const setMode = useGame((g) => g.setMode)
  const spinning = useGame((g) => g.spinning)
  const freeSpin = useGame((g) => g.freeSpin)
  const profile = useGame((g) => g.profile)
  const setProfile = useGame((g) => g.setProfile)
  const disabled = spinning || !!freeSpin
  const tab = (m: 'lines' | 'ways', label: string) => (
    <button
      type="button"
      className={[s.tab, mode === m ? s.tabActive : ''].join(' ')}
      onClick={() => {
        sfx.click()
        setMode(m)
      }}
      disabled={disabled}
      aria-pressed={mode === m}
      title={disabled ? '프리스핀 중에는 모드를 바꿀 수 없습니다' : undefined}
    >
      {label}
    </button>
  )
  return (
    <div className={s.tabs} role="tablist">
      {tab('lines', '페이라인')}
      {tab('ways', '243 웨이즈')}
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
            disabled={disabled}
            aria-pressed={profile === id}
            title={PROFILES[id].description}
          >
            {PROFILES[id].name} {PROFILES[id].rtp}%
          </button>
        ))}
      </div>
    </div>
  )
}

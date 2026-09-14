import { useGame } from '../../store/gameStore'
import { PAYLINE_SETS } from '../../engine/paylines'
import type { PaylineSetId } from '../../engine/types'
import { sfx } from '../../audio/sfx'
import s from './machine.module.css'

/** 판정 방식 탭: 페이라인 세트 6개 + 243 웨이즈 */
export function ModeTabs() {
  const mode = useGame((g) => g.mode)
  const paylineSet = useGame((g) => g.paylineSet)
  const setMode = useGame((g) => g.setMode)
  const setPaylineSet = useGame((g) => g.setPaylineSet)
  const spinning = useGame((g) => g.spinning)
  const freeSpin = useGame((g) => g.freeSpin)
  const disabled = spinning || !!freeSpin
  const title = disabled ? '프리스핀 중에는 판정 방식을 바꿀 수 없습니다' : undefined

  const pickLines = (id: PaylineSetId) => {
    sfx.click()
    if (mode !== 'lines') setMode('lines')
    setPaylineSet(id)
  }

  return (
    <div className={s.tabs} role="tablist" aria-label="판정 방식">
      <div className={s.tabGroup}>
        {PAYLINE_SETS.map((p) => {
          const on = mode === 'lines' && paylineSet === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              className={[s.tab, on ? s.tabActive : ''].join(' ')}
              onClick={() => pickLines(p.id)}
              disabled={disabled}
              aria-selected={on}
              title={title ?? p.origin}
            >
              {p.name}
            </button>
          )
        })}
      </div>
      <span className={s.tabDivider} aria-hidden="true" />
      <button
        type="button"
        role="tab"
        className={[s.tab, s.tabWays, mode === 'ways' ? s.tabActive : ''].join(' ')}
        onClick={() => {
          sfx.click()
          setMode('ways')
        }}
        disabled={disabled}
        aria-selected={mode === 'ways'}
        title={title ?? '페이라인 없이 인접 릴 조합으로 판정. 웨이당 베팅 = 총 베팅 ÷ 25'}
      >
        243 웨이즈
      </button>
    </div>
  )
}

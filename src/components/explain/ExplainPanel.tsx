import { useEffect, useRef } from 'react'
import { useGame } from '../../store/gameStore'
import { RoundSummary, WinList, NearMissList, AllLines, SpecialEvents } from './Sections'
import { Stats } from './Stats'
import { RulesSummary } from './RulesSummary'
import s from './explain.module.css'

export function ExplainPanel() {
  const explanation = useGame((g) => g.explanation)
  const spinning = useGame((g) => g.spinning)
  const hasSpun = useGame((g) => g.hasSpun)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (explanation) topRef.current?.scrollIntoView({ block: 'start' })
  }, [explanation])

  if (!hasSpun) {
    return (
      <div className={s.panel}>
        <RulesSummary />
      </div>
    )
  }

  return (
    <div className={s.panel}>
      <div ref={topRef} />
      {spinning || !explanation ? (
        <div className={s.placeholder}>릴이 도는 중… 멈추면 이 자리에서 이번 판을 설명합니다.</div>
      ) : (
        <>
          <RoundSummary ex={explanation} />
          <WinList ex={explanation} />
          <NearMissList ex={explanation} />
          <AllLines ex={explanation} />
          <SpecialEvents ex={explanation} />
        </>
      )}
      <Stats />
      <RulesSummary compact />
    </div>
  )
}

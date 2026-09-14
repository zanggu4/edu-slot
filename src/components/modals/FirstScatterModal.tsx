import { useGame } from '../../store/gameStore'
import { scatterModal } from '../../engine/explain'
import { SymbolIcon } from '../../assets/symbols'
import { ExplainLine } from '../explain/ExplainLine'
import s from '../explain/explain.module.css'

export function FirstScatterModal() {
  const open = useGame((g) => g.scatterModalOpen)
  const close = useGame((g) => g.closeScatterModal)
  const count = useGame((g) => g.evaluation?.scatter.count ?? 0)
  const profile = useGame((g) => g.profile)
  if (!open) return null
  const SCATTER_MODAL = scatterModal(profile)
  return (
    <div className={s.modalBack} role="dialog" aria-modal="true" aria-labelledby="scatter-title">
      <div className={s.modal}>
        <h2 id="scatter-title" className={s.modalTitle}>
          <SymbolIcon id="scatter" size={36} /> {count >= 3 ? `스캐터가 ${count}개 나왔습니다` : SCATTER_MODAL.title}
        </h2>
        {SCATTER_MODAL.body.map((b, i) => (
          <p key={i}>
            <ExplainLine sentence={b} size={18} />
          </p>
        ))}
        <button type="button" className={s.modalBtn} onClick={close} autoFocus>
          알겠습니다. 프리스핀 시작
        </button>
      </div>
    </div>
  )
}

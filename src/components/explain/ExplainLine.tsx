import type { Sentence } from '../../engine/explain'
import { SymbolIcon } from '../../assets/symbols'
import s from './explain.module.css'

export function ExplainLine({ sentence, size = 18 }: { sentence: Sentence; size?: number }) {
  return (
    <>
      {sentence.map((seg, i) =>
        seg.t === 'text' ? (
          <span key={i}>{seg.v}</span>
        ) : (
          <SymbolIcon key={i} id={seg.v} size={size} className={s.sym} />
        ),
      )}
    </>
  )
}

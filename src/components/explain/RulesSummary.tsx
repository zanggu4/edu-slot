import { useGame } from '../../store/gameStore'
import { getPaylineSet, paylineCells } from '../../engine/paylines'
import type { PaylineSetId } from '../../engine/types'
import { ruleSummary, SYMBOL_RULES } from '../../engine/explain'
import { SymbolIcon } from '../../assets/symbols'
import { ExplainLine } from './ExplainLine'
import s from './explain.module.css'

function LineThumb({ lineNo, setId }: { lineNo: number; setId: PaylineSetId }) {
  const rows = getPaylineSet(setId).lines[lineNo - 1]
  const setHover = useGame((g) => g.setHover)
  const hasResult = useGame((g) => g.grid !== null)
  const cw = 20
  const ch = 14
  const pts = rows.map((r, i) => `${i * cw + cw / 2},${r * ch + ch / 2}`).join(' ')
  return (
    <div
      className={s.thumb}
      onMouseEnter={() => hasResult && setHover({ cells: paylineCells(lineNo, setId), path: paylineCells(lineNo, setId), wildCells: [] })}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${cw * 5} ${ch * 3}`}>
        {Array.from({ length: 15 }, (_, i) => (
          <rect key={i} x={(i % 5) * cw + 1} y={Math.floor(i / 5) * ch + 1} width={cw - 2} height={ch - 2} fill="#0e1120" stroke="#2c3252" />
        ))}
        <polyline points={pts} fill="none" stroke="#ffd76a" strokeWidth="2" />
        {rows.map((r, i) => (
          <circle key={i} cx={i * cw + cw / 2} cy={r * ch + ch / 2} r="2.4" fill="#ffd76a" />
        ))}
      </svg>
      {lineNo}
    </div>
  )
}

export function RulesSummary({ compact }: { compact?: boolean }) {
  const profile = useGame((g) => g.profile)
  const setId = useGame((g) => g.paylineSet)
  const set = getPaylineSet(setId)
  const RULE_SUMMARY = ruleSummary(profile)
  return (
    <div className={s.rules}>
      <h2 className={s.rulesTitle}>{compact ? '규칙 요약' : '슬롯머신 규칙 요약 — 먼저 읽고 SPIN을 눌러보세요'}</h2>
      <ul className={s.ruleList}>
        {RULE_SUMMARY.map((r, i) => (
          <li key={i}>
            <ExplainLine sentence={r} size={16} />
          </li>
        ))}
      </ul>

      <h3 className={s.h}>배당표 (라인당 · 웨이당 베팅 1 기준)</h3>
      <table className={s.payTable}>
        <thead>
          <tr>
            <th>심볼</th>
            <th>2개</th>
            <th>3개</th>
            <th>4개</th>
            <th>5개</th>
            <th className={s.payNote}>설명</th>
          </tr>
        </thead>
        <tbody>
          {SYMBOL_RULES.map((r) => (
            <tr key={r.id}>
              <td>
                <SymbolIcon id={r.id} size={28} /> {r.name}
              </td>
              <td>{r.pay2 ?? '—'}</td>
              <td>{r.id === 'wild' ? '—' : r.pays[0]}</td>
              <td>{r.id === 'wild' ? '—' : r.pays[1]}</td>
              <td>{r.id === 'wild' ? '—' : r.pays[2]}</td>
              <td className={s.payNote}>
                <ExplainLine sentence={r.note} size={14} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className={s.h}>
        페이라인 {set.lines.length}개 · {set.name} 세트 <small>{set.origin} · 마우스를 올리면 기계에 표시</small>
      </h3>
      <div className={s.thumbs}>
        {set.lines.map((_, i) => (
          <LineThumb key={`${setId}-${i}`} lineNo={i + 1} setId={setId} />
        ))}
      </div>
    </div>
  )
}

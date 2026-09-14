import type { ReactNode } from 'react'
import type { Explanation, ExplainItem, OtherLineItem, OtherWayItem } from '../../engine/explain'
import { useGame } from '../../store/gameStore'
import { SymbolIcon } from '../../assets/symbols'
import { ExplainLine } from './ExplainLine'
import s from './explain.module.css'

export function Section({ n, title, sub, children }: { n: number; title: string; sub?: string; children: ReactNode }) {
  return (
    <section className={s.section}>
      <h3 className={s.h}>
        <span className={s.num}>{n}</span>
        {title}
        {sub && <small>{sub}</small>}
      </h3>
      {children}
    </section>
  )
}

export function RoundSummary({ ex }: { ex: Explanation }) {
  const { summary } = ex
  const netCls = summary.net > 0 ? s.netPlus : summary.net < 0 ? s.netMinus : s.netZero
  return (
    <Section n={1} title="이번 판 결론">
      {summary.modeNote && (
        <div className={s.modeNote}>
          <ExplainLine sentence={summary.modeNote} />
        </div>
      )}
      <div className={s.headline}>
        낸 돈 {summary.paid.toLocaleString()} · 받은 돈 {summary.won.toLocaleString()} · 이번 판{' '}
        <span className={[s.net, netCls].join(' ')}>
          {summary.net > 0 ? '+' : ''}
          {summary.net.toLocaleString()}
        </span>
      </div>
      {summary.notes.map((n, i) => (
        <div key={i} className={[s.note, n[0]?.t === 'text' && n[0].v.startsWith('공짜') ? s.noteFree : ''].join(' ')}>
          <ExplainLine sentence={n} />
        </div>
      ))}
    </Section>
  )
}

function Item({ item, near }: { item: ExplainItem; near?: boolean }) {
  const setHover = useGame((g) => g.setHover)
  return (
    <div
      className={[s.item, near ? s.itemNear : ''].join(' ')}
      onMouseEnter={() => setHover({ cells: item.highlight, path: item.path, wildCells: item.wildCells })}
      onMouseLeave={() => setHover(null)}
    >
      <div className={s.itemTitle}>
        <span>
          <ExplainLine sentence={item.title} size={22} />
        </span>
        {item.amount > 0 && <span className={s.amount}>+{item.amount.toLocaleString()}</span>}
      </div>
      <div className={s.body}>
        {item.body.map((b, i) => (
          <div key={i}>
            <ExplainLine sentence={b} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function WinList({ ex }: { ex: Explanation }) {
  return (
    <Section n={2} title="당첨 목록" sub={`${ex.wins.length}건 · 마우스를 올리면 왼쪽 기계에 표시됩니다`}>
      {ex.wins.length === 0 ? (
        <div className={s.empty}>{ex.mode === 'lines' ? '왼쪽부터 3개 이상 이어진 라인이 없습니다.' : '릴1부터 3릴 이상 이어진 심볼이 없습니다.'}</div>
      ) : (
        ex.wins.map((w) => <Item key={w.key} item={w} />)
      )}
    </Section>
  )
}

export function NearMissList({ ex }: { ex: Explanation }) {
  return (
    <Section n={3} title="아까운 목록" sub="2개까지만 이어진 것 전부">
      {ex.nearMisses.length === 0 ? (
        <div className={s.empty}>2개까지 이어진 {ex.mode === 'lines' ? '라인' : '심볼'}이 없습니다.</div>
      ) : (
        ex.nearMisses.map((w) => <Item key={w.key} item={w} near />)
      )}
    </Section>
  )
}

function OtherLine({ l }: { l: OtherLineItem }) {
  const setHover = useGame((g) => g.setHover)
  return (
    <div
      className={[s.other, l.active ? '' : s.otherInactive, l.warn ? s.otherWarn : ''].join(' ')}
      onMouseEnter={() => setHover({ cells: l.highlight, path: l.path, wildCells: [] })}
      onMouseLeave={() => setHover(null)}
    >
      <span className={s.lineNo}>
        라인 {l.lineNo}
        {!l.active && <span title="베팅하지 않은 라인"> ·</span>}
      </span>
      <span className={s.syms}>
        {l.symbols.map((sym, i) => (
          <SymbolIcon key={i} id={sym} size={20} />
        ))}
      </span>
      <span>
        <ExplainLine sentence={l.note} size={16} />
      </span>
    </div>
  )
}

function OtherWay({ w }: { w: OtherWayItem }) {
  const setHover = useGame((g) => g.setHover)
  return (
    <div
      className={s.other}
      style={{ gridTemplateColumns: '1fr' }}
      onMouseEnter={() => setHover({ cells: w.highlight, path: null, wildCells: [] })}
      onMouseLeave={() => setHover(null)}
    >
      <span>
        <ExplainLine sentence={w.note} size={18} />
      </span>
    </div>
  )
}

export function AllLines({ ex }: { ex: Explanation }) {
  if (ex.mode === 'ways') {
    return (
      <Section n={4} title="나머지 심볼" sub="릴1에서 시작 못 했거나 1릴에서 끊긴 것">
        <div className={s.others}>
          {ex.otherWays.length === 0 ? <div className={s.empty}>없음</div> : ex.otherWays.map((w) => <OtherWay key={w.symbol} w={w} />)}
        </div>
      </Section>
    )
  }
  const missed = ex.otherLines.filter((l) => l.warn)
  return (
    <Section
      n={4}
      title="나머지 라인 전부"
      sub={`${ex.otherLines.length}줄 · 흐린 번호는 베팅하지 않은 라인${missed.length ? ` · ⚠ 놓친 라인 ${missed.length}` : ''}`}
    >
      <div className={s.others}>
        {ex.otherLines.map((l) => (
          <OtherLine key={l.lineNo} l={l} />
        ))}
      </div>
    </Section>
  )
}

export function SpecialEvents({ ex }: { ex: Explanation }) {
  return (
    <Section n={5} title="특수 이벤트" sub="스캐터 · 프리스핀 · MAX BET">
      <div className={s.special}>
        {ex.special.map((sp, i) => (
          <div key={i}>
            <ExplainLine sentence={sp} />
          </div>
        ))}
      </div>
    </Section>
  )
}

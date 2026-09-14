import { useGame } from '../../store/gameStore'
import { statsFooter } from '../../engine/explain'
import { ExplainLine } from './ExplainLine'
import { Section } from './Sections'
import s from './explain.module.css'

function BalanceChart() {
  const history = useGame((g) => g.history)
  const W = 600
  const H = 180
  const P = { l: 44, r: 12, t: 12, b: 22 }
  const xs = history.map((h) => h.spin)
  const ys = history.map((h) => h.balance)
  const maxX = Math.max(10, xs[xs.length - 1])
  const maxY = Math.max(1200, ...ys)
  const minY = Math.min(0, ...ys)
  const sx = (x: number) => P.l + ((x - 0) / maxX) * (W - P.l - P.r)
  const sy = (y: number) => P.t + (1 - (y - minY) / (maxY - minY)) * (H - P.t - P.b)
  const d = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${sx(h.spin).toFixed(1)} ${sy(h.balance).toFixed(1)}`).join(' ')
  const startY = sy(1000)
  const ticks = [minY, Math.round((minY + maxY) / 2), maxY]
  return (
    <svg className={s.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="판수에 따른 잔액 추이">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} stroke="#2c3252" strokeWidth="1" />
          <text x={P.l - 6} y={sy(t) + 4} fontSize="10" fill="#8b92b3" textAnchor="end" fontFamily="monospace">
            {t.toLocaleString()}
          </text>
        </g>
      ))}
      <line x1={P.l} x2={W - P.r} y1={startY} y2={startY} stroke="#ffb347" strokeDasharray="4 4" strokeWidth="1" />
      <text x={W - P.r} y={startY - 4} fontSize="10" fill="#ffb347" textAnchor="end">
        시작 1,000
      </text>
      <path d={d} fill="none" stroke="#2ad8ff" strokeWidth="2" strokeLinejoin="round" />
      {history.length > 1 && (
        <circle cx={sx(history[history.length - 1].spin)} cy={sy(history[history.length - 1].balance)} r="3.5" fill="#2ad8ff" />
      )}
      <text x={W - P.r} y={H - 6} fontSize="10" fill="#8b92b3" textAnchor="end">
        판수 → {maxX}
      </text>
    </svg>
  )
}

export function Stats() {
  const st = useGame((g) => g.stats)
  const profile = useGame((g) => g.profile)
  const rtp = st.paid > 0 ? (st.won / st.paid) * 100 : 0
  const net = st.won - st.paid
  const cells: [string, string][] = [
    ['판수', st.spins.toLocaleString()],
    ['낸 돈', st.paid.toLocaleString()],
    ['받은 돈', st.won.toLocaleString()],
    ['순손익', `${net > 0 ? '+' : ''}${net.toLocaleString()}`],
    ['환수율 (받은÷낸)', st.paid > 0 ? `${rtp.toFixed(1)}%` : '—'],
    ['최장 연속 꽝', `${st.longestDry}판`],
    ['프리스핀 진입', `${st.freeSpinSessions}회`],
    ['현재 연속 꽝', `${st.currentDry}판`],
  ]
  return (
    <Section n={6} title="누적 통계" sub="리셋 전까지 누적">
      <div className={s.statsGrid}>
        {cells.map(([k, v]) => (
          <div key={k} className={s.stat}>
            <div className={s.k}>{k}</div>
            <div className={s.v}>{v}</div>
          </div>
        ))}
      </div>
      <BalanceChart />
      <div className={s.footer}>
        <ExplainLine sentence={statsFooter(profile)} />
      </div>
    </Section>
  )
}

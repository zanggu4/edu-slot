/**
 * 판정 결과 → 한국어 설명 데이터.
 * 설명 문장 규칙은 전부 이 파일에만 있다. UI는 Segment 배열을 그대로 렌더한다.
 */
import type { Cell, LineResult, Mode, SpinEvaluation, SymbolId, WayResult } from './types'
import { LINE_COUNT, REELS } from './types'
import { SYMBOL_MAP, SYMBOLS, payFor } from './symbols'
import { PAYLINES } from './paylines'

// ---------- 세그먼트 ----------

export type Segment = { t: 'text'; v: string } | { t: 'sym'; v: SymbolId }
export type Sentence = Segment[]

export const T = (v: string): Segment => ({ t: 'text', v })
export const S = (v: SymbolId): Segment => ({ t: 'sym', v })

function sent(...parts: (Segment | string)[]): Sentence {
  return parts.map((p) => (typeof p === 'string' ? T(p) : p))
}

/** 심볼 나열: 🍋 🍋 ⭐ 🍒 💎 */
function symbolRow(symbols: SymbolId[]): Sentence {
  const out: Sentence = []
  symbols.forEach((s, i) => {
    if (i > 0) out.push(T(' '))
    out.push(S(s))
  })
  return out
}

/** 테스트/디버그용 평문 변환 */
export const EMOJI: Record<SymbolId, string> = {
  cherry: '🍒',
  lemon: '🍋',
  orange: '🍊',
  grape: '🍇',
  bell: '🔔',
  diamond: '💎',
  seven: '7️⃣',
  wild: '⭐',
  scatter: '🎁',
}

export function toPlainText(s: Sentence): string {
  return s.map((seg) => (seg.t === 'text' ? seg.v : EMOJI[seg.v])).join('')
}

export function symbolName(id: SymbolId): string {
  return SYMBOL_MAP[id].name
}

const fmt = (n: number) => n.toLocaleString('ko-KR')
/** 릴 번호 뒤 주격 조사: 릴1이, 릴2가, 릴3이, 릴4가, 릴5가 */
const ga = (n: number) => (n === 1 || n === 3 ? '이' : '가')
/** 릴 번호 뒤 보조사: 릴1은, 릴2는, 릴3은, 릴4는, 릴5는 */
const eun = (n: number) => (n === 1 || n === 3 ? '은' : '는')
const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `-${fmt(-n)}` : '0')

// ---------- 출력 구조 ----------

export interface ExplainItem {
  key: string
  title: Sentence
  body: Sentence[]
  /** 호버 시 강조할 셀 */
  highlight: Cell[]
  /** 라인 경로 (페이라인 모드) */
  path: Cell[] | null
  /** 와일드 셀 */
  wildCells: Cell[]
  amount: number
}

export interface OtherLineItem {
  lineNo: number
  active: boolean
  symbols: SymbolId[]
  note: Sentence
  /** 비활성 라인 당첨 등 주의 표시 */
  warn: boolean
  missedPayout: number
  path: Cell[]
  highlight: Cell[]
}

export interface OtherWayItem {
  symbol: SymbolId
  note: Sentence
  highlight: Cell[]
}

export interface Summary {
  paid: number
  won: number
  net: number
  headline: Sentence
  notes: Sentence[]
  modeNote: Sentence | null
}

export interface Explanation {
  mode: Mode
  summary: Summary
  wins: ExplainItem[]
  nearMisses: ExplainItem[]
  otherLines: OtherLineItem[]
  otherWays: OtherWayItem[]
  special: Sentence[]
  scatterCells: Cell[]
}

export interface ExplainContext {
  /** 이번 판이 프리스핀이었다면: 이번 판 반영 후 남은 횟수, 세션 누적 */
  freeSpin: { remaining: number; multiplier: number; sessionWon: number } | null
  /** 이번 판에 새로 부여된 프리스핀 (0이면 없음) */
  freeSpinsAwarded: number
  /** 이번 판으로 프리스핀이 끝났다면 */
  freeSpinsEnded: { total: number; won: number } | null
  /** 직전에 MAX BET 버튼을 눌러 이 판이 시작됨 */
  maxBetPressed: boolean
  /** 스핀 없이 모드만 바꿔 재판정한 경우 */
  modeSwitched: boolean
}

export const DEFAULT_CONTEXT: ExplainContext = {
  freeSpin: null,
  freeSpinsAwarded: 0,
  freeSpinsEnded: null,
  maxBetPressed: false,
  modeSwitched: false,
}

// ---------- ① 결론 ----------

function buildSummary(e: SpinEvaluation, ctx: ExplainContext): Summary {
  const paid = e.paid
  const won = e.totalWin
  const net = won - paid
  const headline = sent(`낸 돈 ${fmt(paid)} · 받은 돈 ${fmt(won)} · 이번 판 ${signed(net)}`)
  const notes: Sentence[] = []

  if (ctx.freeSpin) {
    notes.push(
      sent(
        `공짜 판 (남은 프리스핀 ${ctx.freeSpin.remaining}, 배수 ×${ctx.freeSpin.multiplier} 적용 중)`,
      ),
    )
  }
  if (won > 0 && won < paid) {
    notes.push(
      sent(
        `당첨 표시는 떴지만 실제로는 ${signed(net)}입니다. 슬롯에서 가장 흔한 "이겼는데 잃은" 판입니다.`,
      ),
    )
  } else if (won === 0 && paid > 0) {
    notes.push(sent(`당첨 없음. 낸 돈 ${fmt(paid)}을 전부 잃었습니다.`))
  } else if (won === 0 && paid === 0) {
    notes.push(sent('공짜 판이라 잃은 돈은 없지만 얻은 것도 없습니다.'))
  } else if (won > paid && paid > 0) {
    notes.push(sent(`낸 돈보다 ${fmt(won - paid)} 더 받았습니다. 이런 판은 생각보다 드뭅니다.`))
  }

  const modeNote = ctx.modeSwitched
    ? sent(e.bet.mode === 'ways' ? '방금 결과를 웨이즈로 보면:' : '방금 결과를 페이라인으로 보면:')
    : null

  return { paid, won, net, headline, notes, modeNote }
}

// ---------- ② ③ ④ 페이라인 ----------

function lineTitle(l: LineResult): Sentence {
  return [T(`라인 ${l.lineNo}  ·  `), ...symbolRow(l.symbols)]
}

function wildNote(l: LineResult): Sentence | null {
  if (l.wildReels.length === 0 || !l.symbol) return null
  const last = l.wildReels[l.wildReels.length - 1] + 1
  const reels = l.wildReels.map((r) => `릴${r + 1}`).join(', ')
  return sent(`${reels}${eun(last)} `, S('wild'), ' 와일드가 ', S(l.symbol), ' 역할.')
}

function lineWinItem(l: LineResult, e: SpinEvaluation): ExplainItem {
  const sym = l.symbol!
  const body: Sentence[] = []
  const n = l.count

  if (n === 2) {
    body.push(sent(S(sym), ' 2개가 왼쪽부터 이어짐. 체리만 2개도 지급합니다.'))
  } else if (n === REELS) {
    body.push(sent(S(sym), ` ${n}개 전부 이어짐 → 5개 배당 적용.`))
  } else {
    body.push(sent(S(sym), ` ${n}개가 왼쪽부터 이어짐.`))
  }
  const wn = wildNote(l)
  if (wn) body.push(wn)
  if (l.brokenAt !== null && n < REELS) {
    const next = l.symbols[l.brokenAt]
    body.push(sent(`릴${l.brokenAt + 1}${ga(l.brokenAt + 1)} `, S(next), `라서 여기서 끊김 → ${n}개 배당 적용.`))
  }
  const base = `라인당 베팅 ${fmt(e.bet.betPerLine)} × 배당 ${fmt(l.basePay)} = ${fmt(l.payout)}`
  if (e.multiplier > 1) {
    body.push(sent(`${base}, 프리스핀 ×${e.multiplier} → ${fmt(l.payout * e.multiplier)}`))
  } else {
    body.push(sent(base))
  }
  return {
    key: `line-${l.lineNo}`,
    title: lineTitle(l),
    body,
    highlight: l.cells.slice(0, n),
    path: l.cells,
    wildCells: l.wildReels.map((r) => l.cells[r]),
    amount: l.payout * e.multiplier,
  }
}

function lineNearItem(l: LineResult, e: SpinEvaluation): ExplainItem {
  const sym = l.symbol!
  const would = payFor(sym, 3) * e.bet.betPerLine
  const body: Sentence[] = []
  body.push(
    sent(
      S(sym),
      ` 2개까지 이어졌는데 릴3에서 끊김. 3개였으면 ${fmt(would * e.multiplier)}.`,
    ),
  )
  const wn = wildNote(l)
  if (wn) body.push(wn)
  body.push(sent('(체리가 아니면 2개는 지급 없음)'))
  if (!l.active) body.push(sent('이 라인은 베팅하지 않은 라인이라 3개였어도 지급 없음.'))
  return {
    key: `line-${l.lineNo}`,
    title: lineTitle(l),
    body,
    highlight: l.cells.slice(0, 2),
    path: l.cells,
    wildCells: l.wildReels.map((r) => l.cells[r]),
    amount: 0,
  }
}

function otherLineNote(l: LineResult, e: SpinEvaluation): { note: Sentence; warn: boolean } {
  const first = l.symbols[0]
  if (l.kind === 'inactiveWin') {
    const missed = l.missedPayout * e.multiplier
    const cnt = l.count
    return {
      note: sent(
        `⚠ `,
        S(l.symbol!),
        ` ${cnt}개 연속인데 이 라인은 베팅하지 않아서 무효. 놓친 금액 ${fmt(missed)}`,
      ),
      warn: true,
    }
  }
  if (l.kind === 'rightOnly' && l.rightCluster) {
    const rc = l.rightCluster
    const from = rc.startReel + 1
    const to = rc.startReel + rc.count
    if (l.symbol === null) {
      return {
        note: sent(
          `릴1이 `,
          S(first),
          ` 스캐터라 라인 심볼 없음 (`,
          S(rc.symbol),
          ` ${rc.count}개가 릴${from}~${to}에 있지만 왼쪽부터가 아니라 무효)`,
        ),
        warn: false,
      }
    }
    return {
      note: sent(
        `릴1 `,
        S(first),
        ` 다음 릴2에서 끊김 (`,
        S(rc.symbol),
        ` ${rc.count}개가 릴${from}~${to}에 모여 있지만 왼쪽부터가 아니라 무효)`,
      ),
      warn: false,
    }
  }
  if (l.symbol === null) {
    return { note: sent(`릴1이 `, S(first), ` 스캐터라 라인 심볼 없음`), warn: false }
  }
  // count === 1
  return {
    note: sent(`릴1 `, S(first), ` 다음 릴2에 `, S(first), '/', S('wild'), ' 없음'),
    warn: false,
  }
}

function buildLineSections(e: SpinEvaluation) {
  const wins: ExplainItem[] = []
  const nearMisses: ExplainItem[] = []
  const otherLines: OtherLineItem[] = []
  for (const l of e.lines) {
    if (l.kind === 'win') wins.push(lineWinItem(l, e))
    else if (l.kind === 'near') nearMisses.push(lineNearItem(l, e))
    else {
      const { note, warn } = otherLineNote(l, e)
      otherLines.push({
        lineNo: l.lineNo,
        active: l.active,
        symbols: l.symbols,
        note,
        warn,
        missedPayout: l.missedPayout * e.multiplier,
        path: l.cells,
        highlight:
          l.kind === 'inactiveWin'
            ? l.cells.slice(0, l.count)
            : l.rightCluster
              ? l.cells.slice(l.rightCluster.startReel, l.rightCluster.startReel + l.rightCluster.count)
              : l.cells.slice(0, 1),
      })
    }
  }
  wins.sort((a, b) => b.amount - a.amount)
  return { wins, nearMisses, otherLines }
}

// ---------- ② ③ ④ 웨이즈 ----------

function wayFormula(w: WayResult): string {
  return w.countsPerReel
    .slice(0, w.reelsMatched)
    .map((n, i) => `릴${i + 1} ${n}개`)
    .join(' × ')
}

function wayTitle(w: WayResult): Sentence {
  return sent(S(w.symbol), `  ·  ${wayFormula(w)} = ${fmt(w.ways)}웨이`)
}

function wayWildNote(w: WayResult): Sentence | null {
  if (w.wildCells.length === 0) return null
  const byReel = new Map<number, number>()
  for (const c of w.wildCells) byReel.set(c.reel, (byReel.get(c.reel) ?? 0) + 1)
  const parts = [...byReel.entries()].map(([r, n]) => `릴${r + 1}의 ${n}개`).join(', ')
  return sent(`${parts}는 `, S('wild'), ' 와일드가 ', S(w.symbol), ' 역할.')
}

function wayWinItem(w: WayResult, e: SpinEvaluation): ExplainItem {
  const body: Sentence[] = []
  const n = w.reelsMatched
  if (n === REELS) {
    body.push(sent('5릴 전부 이어짐 → 5개 배당.'))
  } else if (n === 2) {
    body.push(
      sent(`릴3에 `, S(w.symbol), '도 ', S('wild'), '도 없어서 2릴에서 끊김. 체리만 2개도 지급합니다.'),
    )
  } else {
    body.push(
      sent(`릴${n + 1}에 `, S(w.symbol), '도 ', S('wild'), `도 없어서 ${n}릴에서 끊김 → ${n}개 배당.`),
    )
  }
  const wn = wayWildNote(w)
  if (wn) body.push(wn)
  const base = `${fmt(w.ways)}웨이 × (웨이당 베팅 ${fmt(e.bet.betPerLine)} × 배당 ${fmt(w.basePay)}) = ${fmt(w.payout)}`
  if (e.multiplier > 1) body.push(sent(`${base}, 프리스핀 ×${e.multiplier} → ${fmt(w.payout * e.multiplier)}`))
  else body.push(sent(base))
  return {
    key: `way-${w.symbol}`,
    title: wayTitle(w),
    body,
    highlight: w.cells,
    path: null,
    wildCells: w.wildCells,
    amount: w.payout * e.multiplier,
  }
}

function wayNearItem(w: WayResult, e: SpinEvaluation): ExplainItem {
  const would = payFor(w.symbol, 3) * w.ways * e.bet.betPerLine * e.multiplier
  const body: Sentence[] = [
    sent(`릴3에 `, S(w.symbol), '도 ', S('wild'), `도 없어서 2릴에서 끊김. 3릴이었으면 ${fmt(w.ways)}웨이 × ${fmt(payFor(w.symbol, 3) * e.bet.betPerLine)} = ${fmt(would)}.`),
  ]
  const wn = wayWildNote(w)
  if (wn) body.push(wn)
  body.push(sent('(체리가 아니면 2릴은 지급 없음)'))
  return {
    key: `way-${w.symbol}`,
    title: wayTitle(w),
    body,
    highlight: w.cells,
    path: null,
    wildCells: w.wildCells,
    amount: 0,
  }
}

function buildWaySections(e: SpinEvaluation) {
  const wins: ExplainItem[] = []
  const nearMisses: ExplainItem[] = []
  const otherWays: OtherWayItem[] = []
  for (const w of e.ways) {
    if (w.kind === 'win') wins.push(wayWinItem(w, e))
    else if (w.kind === 'near') nearMisses.push(wayNearItem(w, e))
    else if (w.reelsMatched === 0) {
      otherWays.push({
        symbol: w.symbol,
        note: sent(S(w.symbol), '  ·  릴1에 없음 → 웨이는 릴1부터만 시작'),
        highlight: [],
      })
    } else {
      otherWays.push({
        symbol: w.symbol,
        note: sent(
          S(w.symbol),
          `  ·  릴1 ${w.countsPerReel[0]}개, 릴2에 `,
          S(w.symbol),
          '/',
          S('wild'),
          ' 없음 → 1릴에서 끊김',
        ),
        highlight: w.cells,
      })
    }
  }
  wins.sort((a, b) => b.amount - a.amount)
  return { wins, nearMisses, otherWays }
}

// ---------- ⑤ 특수 이벤트 ----------

function buildSpecial(e: SpinEvaluation, ctx: ExplainContext): Sentence[] {
  const out: Sentence[] = []
  const sc = e.scatter
  const tb = e.totalBet

  if (ctx.maxBetPressed) {
    out.push(
      sent('라인 전부 + 최대 베팅으로 설정됨. 실제 기계에서 이 버튼이 가장 크고 눈에 띄는 이유를 생각해보세요.'),
    )
  }

  if (sc.count >= 3) {
    out.push(
      sent(
        S('scatter'),
        ` ${sc.count}개 — 스캐터(위치 상관없이 인정되는 그림) 배당: 총 베팅 ${fmt(tb)} × ${fmt(sc.basePay)} = ${fmt(sc.payout)}`,
      ),
    )
    if (ctx.freeSpinsAwarded > 0 && ctx.freeSpin) {
      out.push(
        sent(
          `프리스핀 중에 다시 3개 이상 → ${ctx.freeSpinsAwarded}회 추가. 남은 프리스핀 ${ctx.freeSpin.remaining}.`,
        ),
      )
    } else if (ctx.freeSpinsAwarded > 0) {
      out.push(
        sent(
          `프리스핀(공짜 판) ${ctx.freeSpinsAwarded}회 진입. 프리스핀 동안 베팅 차감 없음, 모든 당첨 ×2, 릴 2~4에 와일드가 2배로 자주 나옵니다.`,
        ),
      )
      out.push(sent(`베팅 설정(총 ${fmt(tb)})은 발동 시점 그대로 고정됩니다.`))
    }
  } else if (sc.count === 2) {
    out.push(
      sent(S('scatter'), ' 2개 — 스캐터는 줄 상관없이 화면 어디든 3개면 프리스핀. 지금 1개 부족.'),
    )
  } else if (sc.count === 1) {
    out.push(
      sent(S('scatter'), ' 1개 — 스캐터(위치 상관없이 인정되는 그림)는 화면 어디든 3개면 프리스핀. 지금 2개 부족.'),
    )
  } else {
    out.push(sent(S('scatter'), ' 0개 — 스캐터(위치 상관없이 인정되는 그림)는 이번 판에 없음.'))
  }

  if (ctx.freeSpin) {
    const modeWin = e.baseWin - sc.payout
    out.push(
      sent(
        `프리스핀 배수: 기본 당첨 ${fmt(modeWin)} + 스캐터 ${fmt(sc.payout)} = ${fmt(e.baseWin)} × ${ctx.freeSpin.multiplier} = ${fmt(e.totalWin)}`,
      ),
    )
    out.push(
      sent(
        `남은 프리스핀 ${ctx.freeSpin.remaining}회. 이번 프리스핀 세션 누적 획득 ${fmt(ctx.freeSpin.sessionWon)}.`,
      ),
    )
  }

  if (ctx.freeSpinsEnded) {
    out.push(
      sent(
        `프리스핀 ${ctx.freeSpinsEnded.total}회 동안 총 ${fmt(ctx.freeSpinsEnded.won)} 획득. 이 보너스 확률도 기계 환수율에 이미 계산되어 있습니다.`,
      ),
    )
  }

  return out
}

// ---------- 진입점 ----------

export function explain(e: SpinEvaluation, ctx: ExplainContext = DEFAULT_CONTEXT): Explanation {
  const summary = buildSummary(e, ctx)
  const special = buildSpecial(e, ctx)
  if (e.bet.mode === 'lines') {
    const { wins, nearMisses, otherLines } = buildLineSections(e)
    return {
      mode: 'lines',
      summary,
      wins,
      nearMisses,
      otherLines,
      otherWays: [],
      special,
      scatterCells: e.scatter.cells,
    }
  }
  const { wins, nearMisses, otherWays } = buildWaySections(e)
  return {
    mode: 'ways',
    summary,
    wins,
    nearMisses,
    otherLines: [],
    otherWays,
    special,
    scatterCells: e.scatter.cells,
  }
}

// ---------- 규칙 요약 (첫 진입 화면) ----------

export interface SymbolRule {
  id: SymbolId
  name: string
  pays: [number, number, number]
  pay2?: number
  note: Sentence
}

export const SYMBOL_RULES: SymbolRule[] = SYMBOLS.map((s) => {
  let note: Sentence
  if (s.isWild) note = sent('와일드(다른 그림 대신 쓰이는 그림). 스캐터 빼고 전부 대체. 릴 2, 3, 4에만 나옵니다.')
  else if (s.isScatter)
    note = sent('스캐터(위치 상관없이 인정되는 그림). 화면 어디든 3개 이상이면 프리스핀 10회. 배당은 총 베팅 기준.')
  else if (s.pay2) note = sent(`체리만 2개 연속도 ${s.pay2} 지급.`)
  else note = sent('왼쪽 릴부터 3개 이상 이어져야 지급.')
  return { id: s.id, name: s.name, pays: s.pays, pay2: s.pay2, note }
})

export const RULE_SUMMARY: Sentence[] = [
  sent('릴 5개 × 3줄. 매 판 각 릴이 무작위로 멈춥니다.'),
  sent('페이라인 모드: 정해진 25개 줄 위에서 왼쪽 릴부터 같은 그림이 3개 이상 이어지면 당첨. 중간에 끊기면 그 앞까지만 인정.'),
  sent('웨이즈 모드: 줄이 없습니다. 릴1부터 인접 릴에 같은 그림이 하나라도 있으면 이어진 것으로 봅니다. 웨이 수 = 각 릴의 해당 그림 개수의 곱.'),
  sent('배당은 라인당(웨이당) 베팅 기준입니다. 총 베팅 = 라인 수 × 라인당 베팅.'),
  sent('한 라인에서는 가장 높은 배당 하나만 지급됩니다.'),
  sent('프리스핀: 스캐터 3개 이상이면 10회. 베팅 차감 없음, 모든 당첨 ×2. 프리스핀 중 다시 3개 이상이면 +5회.'),
  sent('이 기계의 목표 환수율은 약 94%입니다. 오래 돌릴수록 낸 돈의 약 6%가 사라집니다.'),
]

export const STATS_FOOTER: Sentence = sent('많이 돌릴수록 환수율은 94% 근처로 수렴합니다. 그 6%가 카지노의 몫입니다.')

export function paylineRows(lineNo: number): readonly number[] {
  return PAYLINES[lineNo - 1]
}

export const ALL_LINE_NUMBERS = Array.from({ length: LINE_COUNT }, (_, i) => i + 1)

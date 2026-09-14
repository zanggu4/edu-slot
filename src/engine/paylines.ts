import type { Cell } from './types'

export type PaylineSetId = 'classic5' | 'novo9' | 'netent10' | 'igt20' | 'classic25' | 'wms30'

export interface PaylineSet {
  id: PaylineSetId
  name: string
  /** 어떤 기종 계열에서 흔한 배치인지 */
  origin: string
  /** 각 항목은 릴0..4의 행 번호 (0=위, 1=가운데, 2=아래) */
  lines: readonly (readonly number[])[]
  /** 라인 수 선택 버튼 옵션 (실제 기계의 LINES 버튼 단계) */
  lineOptions: readonly number[]
}

const MID = [1, 1, 1, 1, 1]
const TOP = [0, 0, 0, 0, 0]
const BOT = [2, 2, 2, 2, 2]
const V = [0, 1, 2, 1, 0]
const A = [2, 1, 0, 1, 2]

/** 25라인: 북미 비디오 슬롯(Aristocrat·WMS 계열)에서 흔한 배치 */
const CLASSIC25 = [
  MID, TOP, BOT, V, A, // 1~5
  [0, 0, 1, 0, 0], // 6
  [2, 2, 1, 2, 2], // 7
  [1, 0, 0, 0, 1], // 8
  [1, 2, 2, 2, 1], // 9
  [1, 0, 1, 0, 1], // 10
  [1, 2, 1, 2, 1], // 11
  [0, 1, 0, 1, 0], // 12
  [2, 1, 2, 1, 2], // 13
  [0, 1, 1, 1, 0], // 14
  [2, 1, 1, 1, 2], // 15
  [1, 1, 0, 1, 1], // 16
  [1, 1, 2, 1, 1], // 17
  [0, 0, 2, 0, 0], // 18
  [2, 2, 0, 2, 2], // 19
  [0, 2, 2, 2, 0], // 20
  [2, 0, 0, 0, 2], // 21
  [1, 0, 2, 0, 1], // 22
  [1, 2, 0, 2, 1], // 23
  [0, 2, 0, 2, 0], // 24
  [2, 0, 2, 0, 2], // 25
] as const

export const PAYLINE_SETS: PaylineSet[] = [
  {
    id: 'classic5',
    name: '5라인 클래식',
    origin: 'Novomatic Sizzling Hot 등 과일 슬롯 계열. 가로 3줄 + V + 역V',
    lines: [MID, TOP, BOT, V, A],
    lineOptions: [1, 3, 5],
  },
  {
    id: 'novo9',
    name: '9라인',
    origin: 'Novomatic Book of Ra 계열. 5라인에 계단·산 모양 4개 추가',
    lines: [
      MID, TOP, BOT, V, A,
      [0, 0, 1, 2, 2], // 6 위→아래 계단
      [2, 2, 1, 0, 0], // 7 아래→위 계단
      [1, 2, 2, 2, 1], // 8 골
      [1, 0, 0, 0, 1], // 9 산
    ],
    lineOptions: [1, 3, 5, 7, 9],
  },
  {
    id: 'netent10',
    name: '10라인',
    origin: 'NetEnt Starburst 등 10라인 온라인 슬롯 계열 (원작은 양방향 지급)',
    lines: [
      MID, TOP, BOT, V, A,
      [0, 0, 1, 0, 0], // 6
      [2, 2, 1, 2, 2], // 7
      [1, 2, 2, 2, 1], // 8
      [1, 0, 0, 0, 1], // 9
      [1, 0, 1, 0, 1], // 10
    ],
    lineOptions: [1, 5, 10],
  },
  {
    id: 'igt20',
    name: '20라인',
    origin: 'IGT Cleopatra 계열. 라인 선택 1/5/9/15/20',
    lines: [
      MID, TOP, BOT, V, A,
      [1, 0, 0, 0, 1], // 6
      [1, 2, 2, 2, 1], // 7
      [0, 0, 1, 2, 2], // 8
      [2, 2, 1, 0, 0], // 9
      [1, 2, 1, 0, 1], // 10
      [1, 0, 1, 2, 1], // 11
      [0, 1, 1, 1, 0], // 12
      [2, 1, 1, 1, 2], // 13
      [0, 1, 0, 1, 0], // 14
      [2, 1, 2, 1, 2], // 15
      [1, 1, 0, 1, 1], // 16
      [1, 1, 2, 1, 1], // 17
      [0, 0, 2, 0, 0], // 18
      [2, 2, 0, 2, 2], // 19
      [0, 2, 0, 2, 0], // 20
    ],
    lineOptions: [1, 5, 9, 15, 20],
  },
  {
    id: 'classic25',
    name: '25라인',
    origin: '북미 비디오 슬롯(Aristocrat·WMS 계열)에서 흔한 배치',
    lines: CLASSIC25,
    lineOptions: [1, 5, 10, 25],
  },
  {
    id: 'wms30',
    name: '30라인',
    origin: 'WMS Zeus 등 30라인 계열. 25라인에 비대칭 5개 추가',
    lines: [
      ...CLASSIC25,
      [0, 1, 2, 2, 2], // 26
      [2, 1, 0, 0, 0], // 27
      [0, 0, 0, 1, 2], // 28
      [2, 2, 2, 1, 0], // 29
      [1, 0, 0, 1, 2], // 30
    ],
    lineOptions: [1, 5, 10, 20, 30],
  },
]

export const DEFAULT_PAYLINE_SET: PaylineSetId = 'classic25'

const SET_MAP = new Map(PAYLINE_SETS.map((s) => [s.id, s]))

export function getPaylineSet(id: PaylineSetId = DEFAULT_PAYLINE_SET): PaylineSet {
  const s = SET_MAP.get(id)
  if (!s) throw new Error(`unknown payline set ${id}`)
  return s
}

/** 기본 세트(25라인) 좌표. 호환용 */
export const PAYLINES = CLASSIC25

export function paylineCells(lineNo: number, setId: PaylineSetId = DEFAULT_PAYLINE_SET): Cell[] {
  const rows = getPaylineSet(setId).lines[lineNo - 1]
  if (!rows) throw new Error(`invalid line ${lineNo}`)
  return rows.map((row, reel) => ({ reel, row }))
}

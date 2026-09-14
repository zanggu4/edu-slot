/** Web Audio 합성 효과음. 외부 파일 없음. 첫 사용자 제스처에서 컨텍스트 생성. */

let ctx: AudioContext | null = null
let muted = false
let master: GainNode | null = null

export function setMuted(m: boolean) {
  muted = m
  if (master) master.gain.value = m ? 0 : 0.5
}

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; at?: number; slideTo?: number } = {}) {
  const c = ensure()
  if (!c || !master) return
  const t0 = c.currentTime + (opts.at ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.3, t0 + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur: number, gain = 0.15, at = 0) {
  const c = ensure()
  if (!c || !master) return
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1200
  const g = c.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(master)
  src.start(c.currentTime + at)
}

export const sfx = {
  unlock() {
    ensure()
  },
  spinStart() {
    noise(0.25, 0.12)
    tone(220, 0.15, { type: 'triangle', gain: 0.15, slideTo: 330 })
  },
  reelStop(i: number) {
    tone(180 + i * 25, 0.08, { type: 'square', gain: 0.12 })
    noise(0.05, 0.1)
  },
  win(size: 'small' | 'mid' | 'big') {
    const base = size === 'big' ? [523, 659, 784, 1047, 1319] : size === 'mid' ? [523, 659, 784, 1047] : [659, 784]
    base.forEach((f, i) => tone(f, 0.25, { type: 'triangle', gain: 0.2, at: i * 0.09 }))
  },
  coin() {
    tone(1568, 0.05, { type: 'square', gain: 0.06 })
  },
  scatter() {
    ;[392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      tone(f, 0.35, { type: 'sawtooth', gain: 0.12, at: i * 0.11 }),
    )
    ;[784, 1047, 1319].forEach((f, i) => tone(f, 0.6, { type: 'triangle', gain: 0.15, at: 0.85 + i * 0.05 }))
  },
  click() {
    tone(900, 0.04, { type: 'square', gain: 0.06 })
  },
  lose() {
    tone(200, 0.2, { type: 'sine', gain: 0.08, slideTo: 150 })
  },
}

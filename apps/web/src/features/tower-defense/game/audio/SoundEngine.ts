export type SoundName =
  | 'shot_bolt'
  | 'shot_shell'
  | 'shot_tracer'
  | 'shot_dart'
  | 'beam'
  | 'pulse'
  | 'stun'
  | 'hit'
  | 'shield'
  | 'death'
  | 'bossDeath'
  | 'leak'
  | 'build'
  | 'upgrade'
  | 'sell'
  | 'select'
  | 'error'
  | 'waveStart'
  | 'boss'
  | 'waveCleared'
  | 'won'
  | 'lost'

const MUTE_KEY = 'safe-td-muted'

const RATE_LIMIT_MS: Partial<Record<SoundName, number>> = {
  shot_bolt: 45,
  shot_dart: 60,
  shot_tracer: 80,
  shot_shell: 80,
  beam: 70,
  hit: 40,
  death: 50,
  shield: 60,
  pulse: 100,
}

// A minor pentatonic-ish palette rooted on A: calm in build phase, tenser once a wave rolls.
const CHORDS: number[][] = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [196, 246.94, 293.66],
  [164.81, 196, 246.94],
]
const ARP_NOTES = [440, 523.25, 659.25, 783.99, 880, 1046.5]

/**
 * Procedural Web Audio sound engine. Everything is synthesised at runtime so the game ships
 * without a single audio asset. Must be unlocked from a user gesture.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private lastPlayed = new Map<SoundName, number>()
  private musicTimer: ReturnType<typeof setInterval> | null = null
  private nextBeat = 0
  private beat = 0
  private intensity = 0
  private mutedState: boolean

  constructor() {
    let stored = false
    try {
      stored = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      stored = false
    }
    this.mutedState = stored
  }

  get muted(): boolean {
    return this.mutedState
  }

  get unlocked(): boolean {
    return this.ctx !== null
  }

  unlock(): void {
    if (this.ctx || typeof window === 'undefined') return
    const Ctor = window.AudioContext
    if (!Ctor) return
    try {
      this.ctx = new Ctor()
    } catch {
      return
    }
    this.master = this.ctx.createGain()
    this.master.gain.value = this.mutedState ? 0 : 0.8
    this.master.connect(this.ctx.destination)
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = 0.55
    this.sfxGain.connect(this.master)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.32
    this.musicGain.connect(this.master)
    const len = this.ctx.sampleRate * 1.5
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    this.startMusic()
  }

  setMuted(muted: boolean): void {
    this.mutedState = muted
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      // ignore storage failures (private mode etc.)
    }
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.8, this.ctx.currentTime + 0.15)
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.mutedState)
    return this.mutedState
  }

  /** 0 = quiet build phase, 1 = wave in progress. Drives the music's tempo and brightness. */
  setIntensity(value: number): void {
    this.intensity = Math.max(0, Math.min(1, value))
  }

  suspend(): void {
    void this.ctx?.suspend()
  }

  resume(): void {
    void this.ctx?.resume()
  }

  dispose(): void {
    if (this.musicTimer) clearInterval(this.musicTimer)
    this.musicTimer = null
    void this.ctx?.close()
    this.ctx = null
  }

  play(name: SoundName): void {
    if (!this.ctx || !this.sfxGain || this.mutedState) return
    const now = performance.now()
    const limit = RATE_LIMIT_MS[name]
    if (limit && now - (this.lastPlayed.get(name) ?? -Infinity) < limit) return
    this.lastPlayed.set(name, now)
    const t = this.ctx.currentTime
    switch (name) {
      case 'shot_bolt':
        this.tone(1200, 400, 0.08, 'square', 0.12, t)
        break
      case 'shot_dart':
        this.tone(700, 1400, 0.09, 'sawtooth', 0.1, t)
        break
      case 'shot_tracer':
        this.tone(2200, 300, 0.18, 'sawtooth', 0.16, t)
        this.noise(0.12, 0.08, 3000, t)
        break
      case 'shot_shell':
        this.noise(0.25, 0.3, 500, t)
        this.tone(140, 60, 0.3, 'triangle', 0.35, t)
        break
      case 'beam':
        this.noise(0.14, 0.14, 6000, t)
        this.tone(900, 1800, 0.1, 'square', 0.08, t)
        break
      case 'pulse':
        this.tone(380, 240, 0.35, 'sine', 0.18, t)
        this.tone(760, 480, 0.3, 'sine', 0.06, t)
        break
      case 'stun':
        this.tone(1500, 200, 0.5, 'triangle', 0.16, t)
        break
      case 'hit':
        this.noise(0.05, 0.07, 2000, t)
        break
      case 'shield':
        this.tone(1800, 1600, 0.12, 'sine', 0.12, t)
        break
      case 'death':
        this.tone(500, 90, 0.25, 'sawtooth', 0.14, t)
        this.noise(0.15, 0.1, 1200, t)
        break
      case 'bossDeath':
        this.noise(0.9, 0.5, 400, t)
        this.tone(220, 40, 1.2, 'sawtooth', 0.5, t)
        this.tone(330, 55, 1.0, 'square', 0.25, t + 0.1)
        break
      case 'leak':
        this.tone(320, 160, 0.4, 'square', 0.3, t)
        this.tone(320, 160, 0.4, 'square', 0.3, t + 0.25)
        break
      case 'build':
        this.tone(523, 523, 0.12, 'triangle', 0.2, t)
        this.tone(784, 784, 0.16, 'triangle', 0.2, t + 0.08)
        break
      case 'upgrade':
        ;[523, 659, 784, 1046].forEach((f, i) => this.tone(f, f, 0.18, 'triangle', 0.18, t + i * 0.07))
        break
      case 'sell':
        this.tone(660, 330, 0.25, 'triangle', 0.18, t)
        break
      case 'select':
        this.tone(880, 880, 0.05, 'sine', 0.1, t)
        break
      case 'error':
        this.tone(200, 150, 0.2, 'square', 0.18, t)
        break
      case 'waveStart':
        ;[220, 220, 330].forEach((f, i) => this.tone(f, f * 0.98, 0.35, 'sawtooth', 0.25, t + i * 0.22))
        this.noise(0.6, 0.12, 800, t)
        break
      case 'boss':
        ;[110, 110, 82.4, 110].forEach((f, i) => this.tone(f, f * 0.97, 0.6, 'sawtooth', 0.35, t + i * 0.35))
        this.noise(1.2, 0.18, 300, t)
        break
      case 'waveCleared':
        ;[523, 659, 784].forEach((f, i) => this.tone(f, f, 0.3, 'triangle', 0.2, t + i * 0.1))
        break
      case 'won':
        ;[523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, f, 0.6, 'triangle', 0.22, t + i * 0.15))
        break
      case 'lost':
        ;[440, 415, 392, 370].forEach((f, i) => this.tone(f, f * 0.9, 0.7, 'sawtooth', 0.22, t + i * 0.3))
        break
      default:
        break
    }
  }

  private tone(from: number, to: number, duration: number, type: OscillatorType, volume: number, at: number): void {
    if (!this.ctx || !this.sfxGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, at)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(at)
    osc.stop(at + duration + 0.02)
  }

  private noise(duration: number, volume: number, cutoff: number, at: number): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cutoff
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(volume, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    src.start(at)
    src.stop(at + duration + 0.02)
  }

  // ─── Music ────────────────────────────────────────────────────────────────────

  private startMusic(): void {
    if (!this.ctx) return
    this.nextBeat = this.ctx.currentTime + 0.1
    this.musicTimer = setInterval(() => this.scheduleMusic(), 120)
  }

  private scheduleMusic(): void {
    if (!this.ctx || !this.musicGain || this.ctx.state !== 'running') return
    const beatLength = 0.5 - this.intensity * 0.14
    while (this.nextBeat < this.ctx.currentTime + 0.4) {
      const bar = Math.floor(this.beat / 8)
      const chord = CHORDS[bar % CHORDS.length]
      if (this.beat % 8 === 0) this.pad(chord, beatLength * 8, this.nextBeat)
      if (this.beat % 2 === 0 || this.intensity > 0.5) {
        const note = ARP_NOTES[(this.beat * 3 + bar) % ARP_NOTES.length] * (chord[0] / 220)
        this.pluck(note / 2, beatLength * 0.9, this.nextBeat, 0.05 + this.intensity * 0.05)
      }
      if (this.intensity > 0.5 && this.beat % 4 === 0) this.kick(this.nextBeat)
      if (this.intensity > 0.5 && this.beat % 4 === 2) this.hat(this.nextBeat)
      this.nextBeat += beatLength
      this.beat++
    }
  }

  private pad(freqs: number[], duration: number, at: number): void {
    if (!this.ctx || !this.musicGain) return
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500 + this.intensity * 900
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.09, at + duration * 0.3)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    filter.connect(gain)
    gain.connect(this.musicGain)
    freqs.forEach((f, i) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      osc.type = i === 0 ? 'sawtooth' : 'triangle'
      osc.frequency.value = f / 2
      osc.detune.value = (i - 1) * 6
      osc.connect(filter)
      osc.start(at)
      osc.stop(at + duration + 0.05)
    })
  }

  private pluck(freq: number, duration: number, at: number, volume: number): void {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(volume, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(at)
    osc.stop(at + duration + 0.02)
  }

  private kick(at: number): void {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    osc.frequency.setValueAtTime(140, at)
    osc.frequency.exponentialRampToValueAtTime(40, at + 0.18)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.35, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2)
    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(at)
    osc.stop(at + 0.22)
  }

  private hat(at: number): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 6000
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.08, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.musicGain)
    src.start(at)
    src.stop(at + 0.08)
  }
}

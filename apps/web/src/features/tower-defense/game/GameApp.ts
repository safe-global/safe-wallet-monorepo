import type { Difficulty, EnemyId, GridCell, TargetingMode, TowerId } from './config/types'
import { TOWERS, sellValue } from './config/towers'
import { ENEMIES } from './config/enemies'
import { getWave, waveEnemyCounts } from './config/waves'
import { Simulation } from './sim/Simulation'
import type { Phase, SimEvent, TowerState } from './sim/types'
import { SoundEngine } from './audio/SoundEngine'
import type { GameRenderer, RendererOptions } from './render/GameRenderer'

export type GameSpeed = 1 | 2 | 3

export interface SelectedTowerInfo {
  uid: number
  towerId: TowerId
  level: number
  kills: number
  damageDealt: number
  upgradeCost: number | null
  sellValue: number
  auraBonus: number
  targeting: TargetingMode
}

export interface WavePreview {
  index: number
  title: string
  intel: string
  enemies: Array<{ enemy: EnemyId; count: number }>
}

export interface GameSnapshot {
  phase: Phase
  difficulty: Difficulty
  wave: number
  totalWaves: number
  waveCountdown: number | null
  canCallWave: boolean
  gold: number
  treasury: number
  maxTreasury: number
  kills: number
  leaked: number
  score: number
  enemiesAlive: number
  speed: GameSpeed
  paused: boolean
  muted: boolean
  bloom: boolean
  endless: boolean
  buildTowerId: TowerId | null
  selected: SelectedTowerInfo | null
  nextWave: WavePreview | null
  currentWave: WavePreview | null
  toast: { id: number; text: string; tone: 'info' | 'danger' | 'success' } | null
  icons: Record<TowerId, string>
  elapsed: number
}

type Listener = () => void

const FIXED_STEP = 1 / 60
const MAX_FRAME = 0.1
const SNAPSHOT_INTERVAL = 0.1

export interface GameAppOptions {
  difficulty: Difficulty
  container: HTMLElement
  rendererOptions: RendererOptions
  createRenderer: (container: HTMLElement, sim: Simulation, options: RendererOptions) => GameRenderer
  renderIcons?: () => Record<TowerId, string>
  seed?: number
}

const emptyIcons = (): Record<TowerId, string> =>
  Object.fromEntries(Object.keys(TOWERS).map((id) => [id, ''])) as Record<TowerId, string>

/**
 * Glue between the simulation, the renderer, the sound engine and the React HUD.
 * Runs the fixed-step game loop and exposes an external store for `useSyncExternalStore`.
 */
export class GameApp {
  readonly sim: Simulation
  readonly renderer: GameRenderer
  readonly sound = new SoundEngine()
  private readonly container: HTMLElement
  private readonly listeners = new Set<Listener>()
  private snapshot: GameSnapshot
  private speed: GameSpeed = 1
  private paused = false
  private buildTowerId: TowerId | null = null
  private selectedUid: number | null = null
  private hoverCell: GridCell | null = null
  private accumulator = 0
  private lastFrame = 0
  private sinceSnapshot = 0
  private rafId = 0
  private toastCounter = 0
  private toastTimeout: ReturnType<typeof setTimeout> | null = null
  private toast: GameSnapshot['toast'] = null
  private readonly icons: Record<TowerId, string>
  private disposed = false
  private readonly startedAt = performance.now()
  private readonly cleanups: Array<() => void> = []

  constructor(options: GameAppOptions) {
    this.container = options.container
    this.sim = new Simulation({ difficulty: options.difficulty, seed: options.seed })
    this.renderer = options.createRenderer(options.container, this.sim, options.rendererOptions)
    this.icons = options.renderIcons ? options.renderIcons() : emptyIcons()
    this.snapshot = this.buildSnapshot()
    this.bindInput()
    this.lastFrame = performance.now()
    this.rafId = requestAnimationFrame(this.frame)
  }

  // ─── External store ───────────────────────────────────────────────────────────

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): GameSnapshot => this.snapshot

  private emit(): void {
    this.snapshot = this.buildSnapshot()
    this.listeners.forEach((l) => l())
  }

  private buildSnapshot(): GameSnapshot {
    const sim = this.sim
    const selected = this.selectedUid === null ? undefined : sim.towers.get(this.selectedUid)
    const nextIndex = sim.waveIndex + 1
    return {
      phase: sim.phase,
      difficulty: sim.difficulty.id,
      wave: sim.waveIndex,
      totalWaves: sim.totalWaves,
      endless: sim.endless,
      waveCountdown: sim.waveCountdown,
      canCallWave: sim.canCallNextWave,
      gold: Math.floor(sim.gold),
      treasury: sim.treasury,
      maxTreasury: sim.maxTreasury,
      kills: sim.kills,
      leaked: sim.leaked,
      score: sim.score,
      enemiesAlive: sim.enemies.size,
      speed: this.speed,
      paused: this.paused,
      muted: this.sound.muted,
      bloom: this.renderer.bloom,
      buildTowerId: this.buildTowerId,
      selected: selected ? this.describeTower(selected) : null,
      nextWave: this.previewWave(nextIndex),
      currentWave: this.previewWave(sim.waveIndex),
      toast: this.toast,
      icons: this.icons,
      elapsed: (performance.now() - this.startedAt) / 1000,
    }
  }

  private describeTower(tower: TowerState): SelectedTowerInfo {
    return {
      uid: tower.uid,
      towerId: tower.def.id,
      level: tower.level,
      kills: tower.kills,
      damageDealt: Math.round(tower.damageDealt),
      upgradeCost: this.sim.upgradeCost(tower),
      sellValue: sellValue(tower.def.id, tower.level),
      auraBonus: this.sim.auraBonus(tower),
      targeting: tower.targeting,
    }
  }

  private previewWave(index: number): WavePreview | null {
    const wave = getWave(index, this.sim.endless)
    if (!wave) return null
    return { index: wave.index, title: wave.title, intel: wave.intel, enemies: waveEnemyCounts(wave) }
  }

  private showToast(text: string, tone: 'info' | 'danger' | 'success' = 'info'): void {
    this.toast = { id: ++this.toastCounter, text, tone }
    if (this.toastTimeout) clearTimeout(this.toastTimeout)
    this.toastTimeout = setTimeout(() => {
      this.toast = null
      this.emit()
    }, 3200)
    this.emit()
  }

  // ─── Commands (called by the HUD and keyboard) ───────────────────────────────

  setBuildTower(id: TowerId | null): void {
    this.sound.unlock()
    this.buildTowerId = this.buildTowerId === id ? null : id
    if (this.buildTowerId) {
      this.selectedUid = null
      this.renderer.setSelected(null)
    }
    this.sound.play('select')
    this.refreshHover()
    this.emit()
  }

  cancel(): void {
    if (this.buildTowerId) this.buildTowerId = null
    else this.selectedUid = null
    this.renderer.setSelected(null)
    this.refreshHover()
    this.emit()
  }

  selectTower(uid: number | null): void {
    this.selectedUid = uid
    this.buildTowerId = null
    const tower = uid === null ? undefined : this.sim.towers.get(uid)
    this.renderer.setSelected(tower ?? null)
    if (tower) this.sound.play('select')
    this.refreshHover()
    this.emit()
  }

  upgradeSelected(): void {
    if (this.selectedUid === null) return
    const tower = this.sim.towers.get(this.selectedUid)
    if (!tower) return
    const cost = this.sim.upgradeCost(tower)
    if (cost === null) return this.showToast('Already at maximum level', 'info')
    if (this.sim.gold < cost) {
      this.sound.play('error')
      return this.showToast(`Need ${cost} SAFE to upgrade`, 'danger')
    }
    if (this.sim.upgradeTower(tower.uid)) {
      this.sound.play('upgrade')
      this.renderer.setSelected(tower)
      this.emit()
    }
  }

  sellSelected(): void {
    if (this.selectedUid === null) return
    const refund = this.sim.sellTower(this.selectedUid)
    if (refund > 0) {
      this.sound.play('sell')
      this.selectedUid = null
      this.renderer.setSelected(null)
      this.emit()
    }
  }

  callNextWave(): void {
    this.sound.unlock()
    if (!this.sim.canCallNextWave) return
    if (this.paused) this.togglePause()
    this.sim.callNextWave()
    this.emit()
  }

  setSpeed(speed: GameSpeed): void {
    this.speed = speed
    this.emit()
  }

  cycleSpeed(): void {
    this.setSpeed(this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1)
  }

  togglePause(): void {
    this.paused = !this.paused
    if (this.paused) this.sound.suspend()
    else this.sound.resume()
    this.emit()
  }

  toggleMute(): void {
    this.sound.unlock()
    this.sound.toggleMuted()
    this.emit()
  }

  setTargeting(mode: TargetingMode): void {
    if (this.selectedUid === null) return
    if (this.sim.setTargeting(this.selectedUid, mode)) {
      this.sound.play('select')
      this.emit()
    }
  }

  cycleTargeting(): void {
    if (this.selectedUid === null) return
    const tower = this.sim.towers.get(this.selectedUid)
    if (!tower) return
    const modes: TargetingMode[] = ['first', 'strongest', 'weakest', 'closest']
    this.setTargeting(modes[(modes.indexOf(tower.targeting) + 1) % modes.length])
  }

  continueEndless(): void {
    if (this.sim.continueEndless()) {
      this.sound.play('waveStart')
      this.showToast('Endless mode: the mempool never sleeps', 'success')
      this.emit()
    }
  }

  toggleBloom(): void {
    this.renderer.setBloom(!this.renderer.bloom)
    this.emit()
  }

  // ─── Input ────────────────────────────────────────────────────────────────────

  private bindInput(): void {
    const el = this.renderer.renderer.domElement
    const on = <K extends keyof HTMLElementEventMap>(
      target: HTMLElement | Window,
      type: K | keyof WindowEventMap,
      handler: (e: never) => void,
      opts?: AddEventListenerOptions,
    ): void => {
      target.addEventListener(type as string, handler as EventListener, opts)
      this.cleanups.push(() => target.removeEventListener(type as string, handler as EventListener, opts))
    }

    on(el, 'contextmenu', (e: MouseEvent) => e.preventDefault())
    on(el, 'pointerdown', (e: PointerEvent) => {
      this.sound.unlock()
      this.renderer.camera.pointerDown(e.button, e.clientX, e.clientY)
      if (e.button === 1) e.preventDefault()
    })
    on(el, 'pointermove', (e: PointerEvent) => {
      this.renderer.camera.pointerMove(e.clientX, e.clientY, e.shiftKey)
      this.hoverCell = this.renderer.pickCell(e.clientX, e.clientY)
      this.refreshHover()
    })
    on(el, 'pointerup', (e: PointerEvent) => {
      const dragged = this.renderer.camera.pointerUp()
      if (dragged) return
      if (e.button === 0) this.handlePrimaryClick(e.clientX, e.clientY, e.shiftKey)
      if (e.button === 2) this.cancel()
    })
    on(el, 'pointerleave', () => {
      this.hoverCell = null
      this.refreshHover()
    })
    on(
      el,
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault()
        this.renderer.camera.wheel(e.deltaY)
      },
      { passive: false },
    )
    on(window, 'keydown', (e: KeyboardEvent) => this.handleKey(e))
    on(window, 'keyup', (e: KeyboardEvent) => this.renderer.camera.keys.delete(e.code))
    on(window, 'blur', () => this.renderer.camera.keys.clear())
  }

  private handlePrimaryClick(x: number, y: number, keepBuilding: boolean): void {
    const cell = this.renderer.pickCell(x, y)
    if (!cell) return
    if (this.buildTowerId) {
      const result = this.sim.canPlace(this.buildTowerId, cell)
      if (!result.ok) {
        this.sound.play('error')
        const reasons: Record<string, string> = {
          gold: `Not enough SAFE for ${TOWERS[this.buildTowerId].name}`,
          path: 'Cannot build on the attack path',
          blocked: 'This tile is blocked',
          occupied: 'There is already a tower here',
          outside: 'Outside the map',
          phase: 'The game is over',
        }
        this.showToast(reasons[result.reason ?? 'outside'], 'danger')
        return
      }
      this.sim.placeTower(this.buildTowerId, cell)
      this.sound.play('build')
      if (!keepBuilding) this.buildTowerId = null
      this.refreshHover()
      this.emit()
      return
    }
    const tower = this.sim.getTowerAt(cell)
    this.selectTower(tower ? tower.uid : null)
  }

  private handleKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
    this.renderer.camera.keys.add(e.code)
    const hotkeyTower = Object.values(TOWERS).find((t) => t.hotkey === e.key)
    if (hotkeyTower) return this.setBuildTower(hotkeyTower.id)
    switch (e.code) {
      case 'Escape':
        this.cancel()
        break
      case 'Space':
        e.preventDefault()
        if (this.sim.canCallNextWave) this.callNextWave()
        break
      case 'KeyU':
        this.upgradeSelected()
        break
      case 'KeyX':
      case 'Delete':
        this.sellSelected()
        break
      case 'KeyP':
        this.togglePause()
        break
      case 'KeyM':
        this.toggleMute()
        break
      case 'KeyF':
        this.cycleSpeed()
        break
      case 'KeyT':
        this.cycleTargeting()
        break
      case 'KeyB':
        this.toggleBloom()
        break
      default:
        break
    }
  }

  private refreshHover(): void {
    if (!this.hoverCell) return this.renderer.setHover(null, null)
    if (this.buildTowerId) {
      const result = this.sim.canPlace(this.buildTowerId, this.hoverCell)
      this.renderer.setHover(this.hoverCell, { towerId: this.buildTowerId, valid: result.ok })
    } else {
      this.renderer.setHover(this.hoverCell, null)
    }
  }

  // ─── Loop ─────────────────────────────────────────────────────────────────────

  private frame = (now: number): void => {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this.frame)
    const frameDt = Math.min(MAX_FRAME, (now - this.lastFrame) / 1000)
    this.lastFrame = now
    const events: SimEvent[] = []
    if (!this.paused && this.sim.phase !== 'won' && this.sim.phase !== 'lost') {
      this.accumulator += frameDt * this.speed
      let steps = 0
      while (this.accumulator >= FIXED_STEP && steps < 12) {
        this.sim.step(FIXED_STEP)
        events.push(...this.sim.drainEvents())
        this.accumulator -= FIXED_STEP
        steps++
      }
    } else {
      events.push(...this.sim.drainEvents())
    }
    events.forEach((event) => this.handleEvent(event))
    this.renderer.update(frameDt * (this.paused ? 0 : 1), events)
    this.renderer.render()
    this.sound.setIntensity(this.sim.phase === 'wave' ? 1 : 0)
    this.sinceSnapshot += frameDt
    if (this.sinceSnapshot >= SNAPSHOT_INTERVAL || events.length > 0) {
      this.sinceSnapshot = 0
      if (this.selectedUid !== null && !this.sim.towers.has(this.selectedUid)) {
        this.selectedUid = null
        this.renderer.setSelected(null)
      }
      this.emit()
    }
  }

  private handleEvent(event: SimEvent): void {
    switch (event.type) {
      case 'shot':
        this.sound.play(`shot_${event.kind}` as const)
        break
      case 'beam':
        this.sound.play('beam')
        break
      case 'pulse':
        this.sound.play(event.towerId === 'timelock' ? 'stun' : 'pulse')
        break
      case 'hit':
        this.sound.play('hit')
        break
      case 'shieldBlock':
        this.sound.play('shield')
        break
      case 'death':
        this.sound.play(event.boss ? 'bossDeath' : 'death')
        if (event.boss) this.showToast(`${ENEMIES[event.enemyId].name} neutralised!`, 'success')
        break
      case 'spawn':
        if (event.boss) {
          this.sound.play('boss')
          this.showToast(`BOSS: ${ENEMIES[event.enemyId].name} has entered the mempool`, 'danger')
        }
        break
      case 'leak':
        this.sound.play('leak')
        this.showToast(`${event.drain} ETH drained from the treasury!`, 'danger')
        break
      case 'waveStart':
        this.sound.play('waveStart')
        this.showToast(
          `Wave ${event.index}: ${event.title}${event.earlyBonus > 0 ? ` (+${event.earlyBonus} SAFE early call)` : ''}`,
          'info',
        )
        break
      case 'waveCleared':
        this.sound.play('waveCleared')
        break
      case 'won':
        this.sound.play('won')
        break
      case 'lost':
        this.sound.play('lost')
        break
      default:
        break
    }
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    if (this.toastTimeout) clearTimeout(this.toastTimeout)
    this.cleanups.forEach((fn) => fn())
    this.sound.dispose()
    this.renderer.dispose()
    this.listeners.clear()
  }
}

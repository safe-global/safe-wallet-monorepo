import { computeDamage } from '../config/combat'
import type { DifficultyDef } from '../config/types'
import type { Difficulty, EnemyId, GridCell, ProjectileKind, TargetingMode, TowerId, Vec2 } from '../config/types'
import { DIFFICULTIES } from '../config/difficulty'
import { ENEMIES } from '../config/enemies'
import {
  buildPathModel,
  cellKey,
  cellToWorld,
  isInsideMap,
  MAP,
  pointAlongPath,
  spawnCell,
  vaultCell,
  type MapDef,
  type PathModel,
} from '../config/map'
import { sellValue, TOWERS } from '../config/towers'
import { getWave, TOTAL_WAVES } from '../config/waves'
import { createRng } from './rng'
import type {
  EnemyState,
  PlacementResult,
  Phase,
  ProjectileState,
  SimEvent,
  SpawnEntry,
  TowerState,
  Vec3,
} from './types'

const CHAIN_JUMP_RANGE = 2.4
const CHAIN_FALLOFF = 0.8
const SPLASH_FALLOFF = 0.6
const REVEAL_DURATION = 0.6
const WAVE_GAP_RATIO = 0.9
const EARLY_CALL_BONUS_PER_SECOND = 1.5

export interface SimulationOptions {
  difficulty: Difficulty
  seed?: number
  map?: MapDef
}

export const distance2 = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z)

/**
 * Pure, deterministic tower defense simulation. Knows nothing about rendering: it advances
 * in fixed steps and emits events the renderer and audio layers consume.
 */
export class Simulation {
  readonly map: MapDef
  readonly path: PathModel
  readonly difficulty: DifficultyDef
  readonly spawnPos: Vec2
  readonly vaultPos: Vec2
  readonly flyLength: number

  phase: Phase = 'building'
  time = 0
  gold: number
  treasury: number
  readonly maxTreasury: number
  waveIndex = 0
  kills = 0
  endless = false
  leaked = 0
  nextWaveAt: number | null
  lastWaveSpawnEnd = 0

  readonly enemies = new Map<number, EnemyState>()
  readonly towers = new Map<number, TowerState>()
  readonly projectiles = new Map<number, ProjectileState>()
  private readonly towerByCell = new Map<string, number>()
  private readonly blocked: Set<string>
  private spawnQueue: SpawnEntry[] = []
  private readonly waveRemaining = new Map<number, number>()
  private readonly waveTotals = new Map<number, number>()
  private readonly clearedWaves = new Set<number>()
  private events: SimEvent[] = []
  private uidCounter = 1
  private readonly rng: () => number

  constructor(options: SimulationOptions) {
    this.map = options.map ?? MAP
    this.path = buildPathModel(this.map)
    this.difficulty = DIFFICULTIES[options.difficulty]
    this.gold = this.difficulty.startingGold
    this.treasury = this.difficulty.treasury
    this.maxTreasury = this.difficulty.treasury
    this.nextWaveAt = this.difficulty.buildTime
    this.rng = createRng(options.seed ?? 1337)
    this.spawnPos = cellToWorld(this.map, spawnCell(this.map))
    this.vaultPos = cellToWorld(this.map, vaultCell(this.map))
    this.flyLength = distance2(this.spawnPos, this.vaultPos)
    const spawn = spawnCell(this.map)
    const vault = vaultCell(this.map)
    this.blocked = new Set([
      ...this.map.decor.map((cell) => cellKey(cell.c, cell.r)),
      cellKey(spawn.c, spawn.r),
      cellKey(vault.c, vault.r),
    ])
  }

  get waveCountdown(): number | null {
    return this.nextWaveAt === null ? null : Math.max(0, this.nextWaveAt - this.time)
  }

  get isSpawning(): boolean {
    return this.spawnQueue.length > 0
  }

  get canCallNextWave(): boolean {
    return (this.phase === 'building' || this.phase === 'wave') && this.waveIndex < this.totalWaves && !this.isSpawning
  }

  /** Number of waves in this run; infinite once endless mode is on. */
  get totalWaves(): number {
    return this.endless ? Infinity : TOTAL_WAVES
  }

  get wavesCleared(): number {
    return this.clearedWaves.size
  }

  get isOver(): boolean {
    return this.phase === 'won' || this.phase === 'lost'
  }

  get score(): number {
    return this.kills * 10 + this.wavesCleared * 100 + Math.round(this.treasury) * 50 + Math.round(this.gold)
  }

  drainEvents(): SimEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  // ─── Building ────────────────────────────────────────────────────────────────

  getTowerAt(cell: GridCell): TowerState | undefined {
    const uid = this.towerByCell.get(cellKey(cell.c, cell.r))
    return uid === undefined ? undefined : this.towers.get(uid)
  }

  canPlace(towerId: TowerId, cell: GridCell): PlacementResult {
    if (this.phase === 'won' || this.phase === 'lost') return { ok: false, reason: 'phase' }
    if (!isInsideMap(this.map, cell)) return { ok: false, reason: 'outside' }
    const key = cellKey(cell.c, cell.r)
    if (this.path.cells.has(key)) return { ok: false, reason: 'path' }
    if (this.blocked.has(key)) return { ok: false, reason: 'blocked' }
    if (this.towerByCell.has(key)) return { ok: false, reason: 'occupied' }
    if (this.gold < TOWERS[towerId].levels[0].cost) return { ok: false, reason: 'gold' }
    return { ok: true }
  }

  placeTower(towerId: TowerId, cell: GridCell): TowerState | undefined {
    if (!this.canPlace(towerId, cell).ok) return undefined
    const def = TOWERS[towerId]
    const tower: TowerState = {
      uid: this.uidCounter++,
      def,
      level: 1,
      cell: { ...cell },
      pos: cellToWorld(this.map, cell),
      cooldownLeft: 0,
      targetUid: null,
      targeting: 'first',
      kills: 0,
      damageDealt: 0,
      builtAt: this.time,
    }
    this.gold -= def.levels[0].cost
    this.towers.set(tower.uid, tower)
    this.towerByCell.set(cellKey(cell.c, cell.r), tower.uid)
    this.events.push({ type: 'build', pos: tower.pos, towerId })
    return tower
  }

  setTargeting(uid: number, mode: TargetingMode): boolean {
    const tower = this.towers.get(uid)
    if (!tower) return false
    tower.targeting = mode
    tower.targetUid = null
    return true
  }

  /** After beating wave 30 the player may keep going against generated waves. */
  continueEndless(): boolean {
    if (this.phase !== 'won') return false
    this.endless = true
    this.phase = 'building'
    this.nextWaveAt = this.time + this.difficulty.buildTime
    return true
  }

  upgradeCost(tower: TowerState): number | null {
    return tower.level >= 3 ? null : tower.def.levels[tower.level].cost
  }

  upgradeTower(uid: number): boolean {
    const tower = this.towers.get(uid)
    if (!tower || this.phase === 'won' || this.phase === 'lost') return false
    const cost = this.upgradeCost(tower)
    if (cost === null || this.gold < cost) return false
    this.gold -= cost
    tower.level += 1
    this.events.push({ type: 'upgrade', pos: tower.pos, towerId: tower.def.id, level: tower.level })
    return true
  }

  sellTower(uid: number): number {
    const tower = this.towers.get(uid)
    if (!tower) return 0
    const refund = sellValue(tower.def.id, tower.level)
    this.gold += refund
    this.towers.delete(uid)
    this.towerByCell.delete(cellKey(tower.cell.c, tower.cell.r))
    this.events.push({ type: 'sell', pos: tower.pos, refund })
    return refund
  }

  // ─── Waves ───────────────────────────────────────────────────────────────────

  callNextWave(): boolean {
    if (!this.canCallNextWave) return false
    const remaining = this.waveCountdown ?? 0
    const earlyBonus = this.waveIndex === 0 ? 0 : Math.floor(remaining * EARLY_CALL_BONUS_PER_SECOND)
    this.gold += earlyBonus
    this.startWave(earlyBonus)
    return true
  }

  private startWave(earlyBonus: number): void {
    const wave = getWave(this.waveIndex + 1, this.endless)
    if (!wave) return
    this.waveIndex = wave.index
    this.phase = 'wave'
    const hpMult = wave.hpMultiplier * this.difficulty.hpMultiplier
    let lastSpawn = 0
    let total = 0
    wave.groups.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        const t = this.time + group.delay + i * group.interval
        lastSpawn = Math.max(lastSpawn, t)
        this.spawnQueue.push({ time: t, enemy: group.enemy, hpMult, wave: wave.index })
        total++
      }
    })
    this.spawnQueue.sort((a, b) => a.time - b.time)
    this.waveRemaining.set(wave.index, total)
    this.waveTotals.set(wave.index, total)
    this.lastWaveSpawnEnd = lastSpawn
    this.nextWaveAt =
      this.waveIndex < this.totalWaves ? lastSpawn + this.difficulty.buildTime * WAVE_GAP_RATIO + 3 : null
    this.events.push({ type: 'waveStart', index: wave.index, title: wave.title, earlyBonus })
  }

  private spawnEnemy(enemyId: EnemyId, hpMult: number, wave: number, dist = 0): EnemyState {
    const def = ENEMIES[enemyId]
    const maxHp = Math.round(def.hp * hpMult)
    const enemy: EnemyState = {
      uid: this.uidCounter++,
      def,
      wave,
      hp: maxHp,
      maxHp,
      hpMult,
      dist,
      pos: this.positionFor(def.flying === true, dist),
      slowFactor: 1,
      slowUntil: 0,
      stunUntil: 0,
      dotDps: 0,
      dotUntil: 0,
      shieldHits: def.shieldHits ?? 0,
      shieldRegenAt: def.shieldRegenSeconds ? this.time + def.shieldRegenSeconds : Infinity,
      revealedUntil: 0,
      summonAt: def.summons ? this.time + def.summons.everySeconds : Infinity,
      spawnedAt: this.time,
    }
    this.enemies.set(enemy.uid, enemy)
    this.events.push({ type: 'spawn', enemyId, pos: enemy.pos, boss: def.boss === true })
    return enemy
  }

  private positionFor(flying: boolean, dist: number): Vec2 {
    if (flying) {
      const t = Math.min(1, dist / this.flyLength)
      return {
        x: this.spawnPos.x + (this.vaultPos.x - this.spawnPos.x) * t,
        z: this.spawnPos.z + (this.vaultPos.z - this.spawnPos.z) * t,
      }
    }
    return pointAlongPath(this.path, dist)
  }

  routeLength(enemy: EnemyState): number {
    return enemy.def.flying ? this.flyLength : this.path.length
  }

  // ─── Stepping ────────────────────────────────────────────────────────────────

  step(dt: number): void {
    if (this.isOver) return
    this.time += dt

    if (this.nextWaveAt !== null && this.time >= this.nextWaveAt && this.waveIndex < this.totalWaves) {
      this.startWave(0)
    }

    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.time) {
      const entry = this.spawnQueue.shift() as SpawnEntry
      this.spawnEnemy(entry.enemy, entry.hpMult, entry.wave)
    }

    this.stepEnemies(dt)
    if (this.isOver) return
    this.stepDetection()
    this.stepTowers(dt)
    this.stepProjectiles(dt)
    this.checkWaveProgress()
  }

  private stepEnemies(dt: number): void {
    for (const enemy of Array.from(this.enemies.values())) {
      if (!this.enemies.has(enemy.uid)) continue
      const def = enemy.def
      if (def.regen) enemy.hp = Math.min(enemy.maxHp, enemy.hp + def.regen * dt)
      if (enemy.dotUntil > this.time) {
        enemy.hp -= enemy.dotDps * dt
        if (enemy.hp <= 0) {
          this.killEnemy(enemy, null)
          continue
        }
      }
      if (def.shieldRegenSeconds && this.time >= enemy.shieldRegenAt) {
        enemy.shieldHits = def.shieldHits ?? 0
        enemy.shieldRegenAt = this.time + def.shieldRegenSeconds
      }
      if (def.summons && this.time >= enemy.summonAt) {
        for (let i = 0; i < def.summons.count; i++) {
          this.addToWave(enemy.wave, 1)
          this.spawnEnemy(def.summons.enemy, enemy.hpMult, enemy.wave, Math.max(0, enemy.dist - 0.6 - i * 0.5))
        }
        enemy.summonAt = this.time + def.summons.everySeconds
      }
      if (enemy.stunUntil > this.time) continue
      const slow = enemy.slowUntil > this.time ? enemy.slowFactor : 1
      enemy.dist += def.speed * slow * dt
      if (enemy.dist >= this.routeLength(enemy)) {
        this.leakEnemy(enemy)
        if (this.isOver) return
        continue
      }
      enemy.pos = this.positionFor(def.flying === true, enemy.dist)
    }
  }

  private leakEnemy(enemy: EnemyState): void {
    this.removeEnemy(enemy)
    this.leaked += 1
    this.treasury = Math.max(0, this.treasury - enemy.def.drain)
    this.events.push({ type: 'leak', pos: this.vaultPos, drain: enemy.def.drain, enemyId: enemy.def.id })
    if (this.treasury <= 0) {
      this.phase = 'lost'
      this.events.push({ type: 'lost' })
    }
  }

  private stepDetection(): void {
    const detectors = Array.from(this.towers.values()).filter((t) => t.def.levels[t.level - 1].detectRange)
    if (detectors.length === 0) return
    for (const enemy of this.enemies.values()) {
      if (!enemy.def.stealth) continue
      for (const tower of detectors) {
        const range = tower.def.levels[tower.level - 1].detectRange ?? 0
        if (distance2(tower.pos, enemy.pos) <= range) {
          enemy.revealedUntil = this.time + REVEAL_DURATION
          break
        }
      }
    }
  }

  isTargetable(tower: TowerState, enemy: EnemyState): boolean {
    const targets = tower.def.targets
    if (targets === 'none') return false
    if (enemy.def.flying && targets === 'ground') return false
    if (!enemy.def.flying && targets === 'air') return false
    if (enemy.def.stealth && enemy.revealedUntil <= this.time) return false
    return true
  }

  private enemiesInRange(tower: TowerState, range: number): EnemyState[] {
    const list: EnemyState[] = []
    for (const enemy of this.enemies.values()) {
      if (this.isTargetable(tower, enemy) && distance2(tower.pos, enemy.pos) <= range) list.push(enemy)
    }
    return list
  }

  auraBonus(tower: TowerState): number {
    let best = 0
    for (const other of this.towers.values()) {
      const lvl = other.def.levels[other.level - 1]
      if (!lvl.auraDamageBonus || other.uid === tower.uid) continue
      if (distance2(other.pos, tower.pos) <= lvl.range) best = Math.max(best, lvl.auraDamageBonus)
    }
    return 1 + best
  }

  private muzzle(tower: TowerState): Vec3 {
    return { x: tower.pos.x, y: 1.1 + tower.level * 0.15, z: tower.pos.z }
  }

  private stepTowers(dt: number): void {
    for (const tower of this.towers.values()) {
      tower.cooldownLeft -= dt
      if (tower.def.targets === 'none') continue
      const lvl = tower.def.levels[tower.level - 1]
      const current = tower.targetUid === null ? undefined : this.enemies.get(tower.targetUid)
      const keepTarget = current && this.isTargetable(tower, current) && distance2(tower.pos, current.pos) <= lvl.range
      if (!keepTarget) {
        const picked = this.pickTarget(tower, this.enemiesInRange(tower, lvl.range))
        tower.targetUid = picked ? picked.uid : null
      }
      if (tower.cooldownLeft > 0 || tower.targetUid === null) continue
      const target = this.enemies.get(tower.targetUid)
      if (!target) continue
      tower.cooldownLeft = lvl.cooldown
      const bonus = this.auraBonus(tower)
      const projectile = tower.def.projectile
      if (projectile === 'beam') this.fireBeam(tower, target, bonus)
      else if (projectile === 'pulse') this.firePulse(tower, bonus)
      else if (projectile !== 'none') this.fireProjectile(tower, target, bonus, projectile)
    }
  }

  /** Chooses a target according to the tower's targeting mode. */
  pickTarget(tower: TowerState, candidates: EnemyState[]): EnemyState | undefined {
    if (candidates.length === 0) return undefined
    const progress = (e: EnemyState): number => e.dist / this.routeLength(e)
    switch (tower.targeting) {
      case 'strongest':
        return candidates.reduce((best, e) => (e.hp > best.hp ? e : best))
      case 'weakest':
        return candidates.reduce((best, e) => (e.hp < best.hp ? e : best))
      case 'closest':
        return candidates.reduce((best, e) => (distance2(tower.pos, e.pos) < distance2(tower.pos, best.pos) ? e : best))
      default:
        return candidates.reduce((best, e) => (progress(e) > progress(best) ? e : best))
    }
  }

  private fireProjectile(tower: TowerState, target: EnemyState, bonus: number, kind: ProjectileKind): void {
    const lvl = tower.def.levels[tower.level - 1]
    const from = this.muzzle(tower)
    const projectile: ProjectileState = {
      uid: this.uidCounter++,
      kind,
      towerId: tower.def.id,
      towerUid: tower.uid,
      pos: { ...from },
      targetUid: target.uid,
      lastTargetPos: this.enemyHitPoint(target),
      speed: lvl.projectileSpeed ?? 12,
      damage: lvl.damage,
      attackType: tower.def.attackType,
      bonus,
      splash: lvl.splash ?? 0,
      slow: lvl.slow,
      dot: lvl.dot,
      color: tower.def.color,
    }
    this.projectiles.set(projectile.uid, projectile)
    this.events.push({ type: 'shot', towerUid: tower.uid, towerId: tower.def.id, from, kind })
  }

  enemyHitPoint(enemy: EnemyState): Vec3 {
    return { x: enemy.pos.x, y: (enemy.def.flying ? 1.8 : 0.45) * enemy.def.scale + 0.15, z: enemy.pos.z }
  }

  private fireBeam(tower: TowerState, target: EnemyState, bonus: number): void {
    const lvl = tower.def.levels[tower.level - 1]
    const points: Vec3[] = [this.muzzle(tower)]
    const hit = new Set<number>()
    let current: EnemyState | undefined = target
    let damage = lvl.damage
    let jumps = 0
    while (current && jumps < (lvl.chain ?? 1)) {
      points.push(this.enemyHitPoint(current))
      hit.add(current.uid)
      this.applyDamage(current, damage, tower, bonus)
      damage *= CHAIN_FALLOFF
      jumps++
      const from: Vec2 = current.pos
      let next: EnemyState | undefined
      let bestDist = Infinity
      for (const enemy of this.enemies.values()) {
        if (hit.has(enemy.uid) || !this.isTargetable(tower, enemy)) continue
        const d = distance2(from, enemy.pos)
        if (d <= CHAIN_JUMP_RANGE && d < bestDist) {
          bestDist = d
          next = enemy
        }
      }
      current = next
    }
    this.events.push({ type: 'beam', points, color: tower.def.color })
    this.events.push({ type: 'shot', towerUid: tower.uid, towerId: tower.def.id, from: points[0], kind: 'bolt' })
  }

  private firePulse(tower: TowerState, bonus: number): void {
    const lvl = tower.def.levels[tower.level - 1]
    const victims = this.enemiesInRange(tower, lvl.range)
    for (const enemy of victims) {
      if (lvl.stun) enemy.stunUntil = Math.max(enemy.stunUntil, this.time + lvl.stun)
      if (lvl.slow) this.applySlow(enemy, lvl.slow.factor, lvl.slow.duration)
      if (lvl.damage > 0) this.applyDamage(enemy, lvl.damage, tower, bonus)
    }
    this.events.push({
      type: 'pulse',
      pos: tower.pos,
      radius: lvl.range,
      color: tower.def.color,
      towerId: tower.def.id,
    })
  }

  private applySlow(enemy: EnemyState, factor: number, duration: number): void {
    enemy.slowFactor = enemy.slowUntil > this.time ? Math.min(enemy.slowFactor, factor) : factor
    enemy.slowUntil = Math.max(enemy.slowUntil, this.time + duration)
  }

  private stepProjectiles(dt: number): void {
    for (const p of Array.from(this.projectiles.values())) {
      const target = this.enemies.get(p.targetUid)
      if (target) p.lastTargetPos = this.enemyHitPoint(target)
      const aim = p.lastTargetPos
      const dx = aim.x - p.pos.x
      const dy = aim.y - p.pos.y
      const dz = aim.z - p.pos.z
      const remaining = Math.hypot(dx, dy, dz)
      const stepLen = p.speed * dt
      if (remaining <= stepLen || remaining < 0.05) {
        p.pos = { ...aim }
        this.impact(p, target)
        this.projectiles.delete(p.uid)
        continue
      }
      const k = stepLen / remaining
      p.pos = { x: p.pos.x + dx * k, y: p.pos.y + dy * k, z: p.pos.z + dz * k }
    }
  }

  private impact(p: ProjectileState, target: EnemyState | undefined): void {
    const tower = this.towers.get(p.towerUid) ?? null
    this.events.push({ type: 'hit', pos: p.pos, color: p.color, kind: p.kind, splash: p.splash })
    const applyEffects = (enemy: EnemyState): void => {
      if (p.slow) this.applySlow(enemy, p.slow.factor, p.slow.duration)
      if (p.dot) {
        enemy.dotDps = Math.max(enemy.dotDps * (enemy.dotUntil > this.time ? 1 : 0), p.dot.dps)
        enemy.dotUntil = Math.max(enemy.dotUntil, this.time + p.dot.duration)
      }
    }
    if (target) {
      applyEffects(target)
      this.applyDamage(target, p.damage, tower, p.bonus)
    }
    if (p.splash > 0) {
      const centre: Vec2 = { x: p.pos.x, z: p.pos.z }
      for (const enemy of Array.from(this.enemies.values())) {
        if (enemy.uid === p.targetUid || enemy.def.flying) continue
        if (distance2(centre, enemy.pos) <= p.splash) {
          applyEffects(enemy)
          this.applyDamage(enemy, p.damage * SPLASH_FALLOFF, tower, p.bonus)
        }
      }
    }
  }

  applyDamage(enemy: EnemyState, base: number, tower: TowerState | null, bonus: number): number {
    if (!this.enemies.has(enemy.uid)) return 0
    if (enemy.shieldHits > 0) {
      enemy.shieldHits -= 1
      this.events.push({ type: 'shieldBlock', pos: enemy.pos })
      return 0
    }
    const attackType = tower?.def.attackType ?? 'magic'
    const dmg = computeDamage(base, attackType, enemy.def.armor, enemy.def.armorValue, bonus)
    enemy.hp -= dmg
    if (tower) tower.damageDealt += dmg
    if (enemy.hp <= 0) this.killEnemy(enemy, tower)
    return dmg
  }

  private killEnemy(enemy: EnemyState, tower: TowerState | null): void {
    if (!this.enemies.has(enemy.uid)) return
    this.removeEnemy(enemy)
    const bounty = Math.max(1, Math.round(enemy.def.bounty * this.difficulty.bountyMultiplier))
    this.gold += bounty
    this.kills += 1
    if (tower) tower.kills += 1
    this.events.push({
      type: 'death',
      pos: enemy.pos,
      enemyId: enemy.def.id,
      bounty,
      boss: enemy.def.boss === true,
      scale: enemy.def.scale,
      color: enemy.def.color,
    })
    if (enemy.def.splitsInto) {
      for (let i = 0; i < enemy.def.splitsInto.count; i++) {
        const offset = (this.rng() - 0.5) * 1.6
        this.addToWave(enemy.wave, 1)
        this.spawnEnemy(enemy.def.splitsInto.enemy, enemy.hpMult, enemy.wave, Math.max(0, enemy.dist + offset))
      }
    }
  }

  private addToWave(wave: number, count: number): void {
    this.waveRemaining.set(wave, (this.waveRemaining.get(wave) ?? 0) + count)
    this.waveTotals.set(wave, (this.waveTotals.get(wave) ?? 0) + count)
  }

  /** How far a wave has progressed: attackers still to spawn, still alive and already dealt with. */
  waveProgress(wave: number): { total: number; queued: number; alive: number; done: number } | null {
    const total = this.waveTotals.get(wave)
    if (total === undefined) return null
    const queued = this.spawnQueue.filter((entry) => entry.wave === wave).length
    const remaining = this.waveRemaining.get(wave) ?? 0
    const alive = Math.max(0, remaining - queued)
    return { total, queued, alive, done: Math.max(0, total - remaining) }
  }

  private removeEnemy(enemy: EnemyState): void {
    this.enemies.delete(enemy.uid)
    const tracked = this.waveRemaining.get(enemy.wave)
    if (tracked === undefined) return
    const remaining = tracked - 1
    this.waveRemaining.set(enemy.wave, remaining)
    if (remaining <= 0) this.clearWave(enemy.wave)
  }

  private clearWave(wave: number): void {
    if (this.clearedWaves.has(wave) || wave === 0) return
    this.clearedWaves.add(wave)
    const bonus = 30 + wave * 6
    const income = Array.from(this.towers.values()).reduce((sum, t) => sum + (t.def.levels[t.level - 1].income ?? 0), 0)
    this.gold += bonus + income
    this.events.push({ type: 'waveCleared', index: wave, bonus, income })
  }

  /** Once nothing is alive or queued the map is calm again; after the last wave that means victory. */
  private checkWaveProgress(): void {
    if (this.waveIndex === 0 || this.isSpawning || this.enemies.size > 0 || this.isOver) return
    if (!this.endless && this.waveIndex >= TOTAL_WAVES && this.clearedWaves.size >= TOTAL_WAVES) {
      this.phase = 'won'
      this.nextWaveAt = null
      this.events.push({ type: 'won' })
    } else {
      this.phase = 'building'
    }
  }
}

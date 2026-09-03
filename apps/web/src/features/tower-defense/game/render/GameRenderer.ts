import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { GridCell, TowerId } from '../config/types'
import { TOWERS } from '../config/towers'
import { cellToWorld, directionAlongPath, isInsideMap, worldToCell } from '../config/map'
import type { Simulation } from '../sim/Simulation'
import type { EnemyState, ProjectileState, SimEvent, TowerState, Vec3 } from '../sim/types'
import { createRng } from '../sim/rng'
import { CameraController } from './CameraController'
import { BeamSystem, FloatingTextLayer, ParticleSystem, PulseSystem, type FloatingTextClasses } from './effects'
import { buildEnemyModel, type EnemyModel } from './enemyMeshes'
import { buildEnvironment, type Environment } from './environment'
import { box, cone, plane, ring, sphere } from './geometry'
import { COLORS, glow, material } from './materials'
import { buildGhostModel, buildTowerModel, type TowerModel } from './towerMeshes'

interface TowerView {
  model: TowerModel
  level: number
  recoil: number
  yaw: number
}

interface EnemyView {
  model: EnemyModel
  yaw: number
  phase: number
  baseEmissive: number[]
  baseOpacity: number[]
}

export interface RendererOptions {
  floatingTextClasses: FloatingTextClasses
  bloom?: boolean
}

const SLOW_TINT = new THREE.Color(0x2f7fff)
const STUN_TINT = new THREE.Color(0xffd166)
const HP_COLORS = {
  high: new THREE.Color(COLORS.safeGreen),
  mid: new THREE.Color(COLORS.warning),
  low: new THREE.Color(COLORS.danger),
}
const HOVER_Y = 0.215

/**
 * Three.js view of the simulation. Owns the WebGL renderer, camera, environment and all
 * per-entity meshes; reads the simulation each frame and reacts to the events it emitted.
 */
export class GameRenderer {
  readonly scene = new THREE.Scene()
  readonly renderer: THREE.WebGLRenderer
  readonly camera: CameraController
  private readonly composer: EffectComposer
  private readonly bloomPass: UnrealBloomPass
  private bloomEnabled: boolean
  private readonly env: Environment
  private readonly particles = new ParticleSystem()
  private readonly beams = new BeamSystem()
  private readonly pulses = new PulseSystem()
  private readonly floating: FloatingTextLayer
  private readonly textLayer: HTMLDivElement
  private readonly towerViews = new Map<number, TowerView>()
  private readonly enemyViews = new Map<number, EnemyView>()
  private readonly projectileViews = new Map<number, THREE.Object3D>()
  private readonly hoverTile: THREE.Mesh
  private readonly hoverRing: THREE.Mesh
  private readonly selectedRing: THREE.Mesh
  private ghost: THREE.Group | null = null
  private ghostKey = ''
  private readonly raycaster = new THREE.Raycaster()
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2)
  private readonly pointer = new THREE.Vector2()
  private readonly hitPoint = new THREE.Vector3()
  private readonly resizeObserver: ResizeObserver | null
  private damageFlash = 0
  private time = 0
  private width = 1
  private height = 1
  private readonly flyDir: { x: number; z: number }

  constructor(
    private readonly container: HTMLElement,
    private readonly sim: Simulation,
    options: RendererOptions,
  ) {
    this.bloomEnabled = options.bloom ?? true
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    container.appendChild(this.renderer.domElement)

    this.textLayer = document.createElement('div')
    this.textLayer.style.position = 'absolute'
    this.textLayer.style.inset = '0'
    this.textLayer.style.pointerEvents = 'none'
    this.textLayer.style.overflow = 'hidden'
    container.appendChild(this.textLayer)
    this.floating = new FloatingTextLayer(this.textLayer, options.floatingTextClasses)

    this.scene.background = new THREE.Color(COLORS.background)
    this.scene.fog = new THREE.FogExp2(COLORS.background, 0.016)

    const map = sim.map
    this.camera = new CameraController(1, {
      minX: -map.cols / 2 - 2,
      maxX: map.cols / 2 + 2,
      minZ: -map.rows / 2 - 2,
      maxZ: map.rows / 2 + 2,
    })
    this.camera.focus(0.5, 0.5)

    const hemi = new THREE.HemisphereLight(0x9fd8c0, 0x0a0f0c, 0.75)
    this.scene.add(hemi)
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.9)
    sun.position.set(14, 24, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 90
    sun.shadow.camera.left = -20
    sun.shadow.camera.right = 20
    sun.shadow.camera.top = 20
    sun.shadow.camera.bottom = -20
    sun.shadow.bias = -0.0006
    sun.shadow.normalBias = 0.02
    this.scene.add(sun)
    this.scene.add(sun.target)
    const rim = new THREE.DirectionalLight(0x12ff80, 0.35)
    rim.position.set(-12, 8, -14)
    this.scene.add(rim)

    this.env = buildEnvironment(map, sim.path, createRng(42))
    this.scene.add(this.env.group)
    this.scene.add(this.particles.points, this.beams.group, this.pulses.group)

    this.hoverTile = new THREE.Mesh(
      plane(0.98, 0.98),
      new THREE.MeshBasicMaterial({ color: COLORS.safeGreen, transparent: true, opacity: 0.35, depthWrite: false }),
    )
    this.hoverTile.rotation.x = -Math.PI / 2
    this.hoverTile.visible = false
    this.scene.add(this.hoverTile)
    this.hoverRing = this.makeRing(COLORS.safeGreen, 0.35)
    this.selectedRing = this.makeRing(0xffffff, 0.45)
    this.scene.add(this.hoverRing, this.selectedRing)

    this.flyDir = {
      x: sim.vaultPos.x - sim.spawnPos.x,
      z: sim.vaultPos.z - sim.spawnPos.z,
    }

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera.camera))
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.84)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(new OutputPass())

    this.resize()
    this.resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.resize())
    this.resizeObserver?.observe(container)
  }

  private makeRing(color: number, opacity: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      ring(0.96, 1, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = HOVER_Y + 0.01
    mesh.visible = false
    return mesh
  }

  resize(): void {
    this.width = Math.max(1, this.container.clientWidth)
    this.height = Math.max(1, this.container.clientHeight)
    this.renderer.setSize(this.width, this.height, false)
    this.composer.setSize(this.width, this.height)
    this.bloomPass.setSize(this.width, this.height)
    this.camera.setAspect(this.width / this.height)
  }

  setBloom(enabled: boolean): void {
    this.bloomEnabled = enabled
  }

  get bloom(): boolean {
    return this.bloomEnabled
  }

  // ─── Picking & overlays ───────────────────────────────────────────────────────

  pickCell(clientX: number, clientY: number): GridCell | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera.camera)
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, this.hitPoint)) return null
    const cell = worldToCell(this.sim.map, { x: this.hitPoint.x, z: this.hitPoint.z })
    return isInsideMap(this.sim.map, cell) ? cell : null
  }

  setHover(cell: GridCell | null, ghost: { towerId: TowerId; valid: boolean } | null): void {
    if (!cell) {
      this.hoverTile.visible = false
      this.hoverRing.visible = false
      if (this.ghost) this.ghost.visible = false
      return
    }
    const world = cellToWorld(this.sim.map, cell)
    this.hoverTile.visible = true
    this.hoverTile.position.set(world.x, HOVER_Y, world.z)
    const tileMat = this.hoverTile.material as THREE.MeshBasicMaterial
    if (ghost) {
      tileMat.color.setHex(ghost.valid ? COLORS.safeGreen : COLORS.danger)
      const key = `${ghost.towerId}:${ghost.valid}`
      if (key !== this.ghostKey) {
        if (this.ghost) this.scene.remove(this.ghost)
        this.ghost = buildGhostModel(TOWERS[ghost.towerId], ghost.valid)
        this.scene.add(this.ghost)
        this.ghostKey = key
      }
      if (this.ghost) {
        this.ghost.visible = true
        this.ghost.position.set(world.x, 0.2, world.z)
      }
      const range = TOWERS[ghost.towerId].levels[0].range
      this.hoverRing.visible = true
      this.hoverRing.position.set(world.x, HOVER_Y + 0.01, world.z)
      this.hoverRing.scale.setScalar(range)
      ;(this.hoverRing.material as THREE.MeshBasicMaterial).color.setHex(ghost.valid ? COLORS.safeGreen : COLORS.danger)
    } else {
      tileMat.color.setHex(0xffffff)
      this.hoverRing.visible = false
      if (this.ghost) this.ghost.visible = false
    }
  }

  setSelected(tower: TowerState | null): void {
    if (!tower) {
      this.selectedRing.visible = false
      return
    }
    const lvl = tower.def.levels[tower.level - 1]
    this.selectedRing.visible = true
    this.selectedRing.position.set(tower.pos.x, HOVER_Y + 0.02, tower.pos.z)
    this.selectedRing.scale.setScalar(lvl.range)
    ;(this.selectedRing.material as THREE.MeshBasicMaterial).color.setHex(tower.def.color)
  }

  focusOn(x: number, z: number): void {
    this.camera.focus(x, z)
  }

  // ─── Frame update ─────────────────────────────────────────────────────────────

  update(dt: number, events: SimEvent[]): void {
    this.time += dt
    this.camera.update(dt)
    this.damageFlash = Math.max(0, this.damageFlash - dt * 1.8)
    events.forEach((event) => this.handleEvent(event))
    this.syncTowers(dt)
    this.syncEnemies(dt)
    this.syncProjectiles()
    this.env.update(dt, this.time, this.sim.treasury / this.sim.maxTreasury, this.damageFlash)
    this.particles.update(dt)
    this.beams.update(dt)
    this.pulses.update(dt)
    this.floating.update(dt, this.camera.camera, this.width, this.height)
    if (this.hoverRing.visible) this.hoverRing.rotation.z += dt * 0.5
    if (this.selectedRing.visible) this.selectedRing.rotation.z -= dt * 0.4
  }

  render(): void {
    if (this.bloomEnabled) this.composer.render()
    else this.renderer.render(this.scene, this.camera.camera)
  }

  private handleEvent(event: SimEvent): void {
    switch (event.type) {
      case 'shot': {
        const view = this.towerViews.get(event.towerUid)
        if (view) view.recoil = 1
        this.particles.emit(event.from, {
          count: 3,
          color: TOWERS[event.towerId].color,
          speed: 1.2,
          life: 0.25,
          size: 0.12,
          gravity: 0,
        })
        break
      }
      case 'hit':
        this.particles.emit(event.pos, {
          count: event.kind === 'shell' ? 22 : 7,
          color: event.color,
          speed: event.kind === 'shell' ? 4 : 2.2,
          life: event.kind === 'shell' ? 0.7 : 0.4,
          size: event.kind === 'shell' ? 0.26 : 0.14,
        })
        if (event.splash > 0) this.pulses.add({ x: event.pos.x, z: event.pos.z }, event.splash, event.color, 0.4)
        break
      case 'beam':
        this.beams.add(event.points, event.color)
        event.points
          .slice(1)
          .forEach((p) => this.particles.emit(p, { count: 4, color: event.color, speed: 1.5, life: 0.3, size: 0.12 }))
        break
      case 'pulse':
        this.pulses.add(event.pos, event.radius, event.color, event.towerId === 'timelock' ? 0.9 : 0.6)
        break
      case 'shieldBlock':
        this.particles.emit(
          { x: event.pos.x, y: 0.9, z: event.pos.z },
          { count: 6, color: 0x9be7ff, speed: 1.6, life: 0.3, size: 0.12 },
        )
        break
      case 'death': {
        const pos = { x: event.pos.x, y: 0.6 * event.scale, z: event.pos.z }
        this.particles.emit(pos, {
          count: Math.round(14 * event.scale) + (event.boss ? 60 : 0),
          color: event.color,
          speed: event.boss ? 5 : 2.6,
          life: event.boss ? 1.4 : 0.7,
          size: event.boss ? 0.34 : 0.2,
          gravity: 3,
        })
        if (event.boss) this.pulses.add(event.pos, 3.5, event.color, 1.2)
        this.floating.add({ x: pos.x, y: pos.y + 0.6, z: pos.z }, `+${event.bounty}`, event.boss ? 'bonus' : 'gold')
        break
      }
      case 'leak':
        this.damageFlash = 1
        this.particles.emit(
          { x: event.pos.x, y: 1.4, z: event.pos.z },
          { count: 30, color: COLORS.danger, speed: 3.5, life: 0.9, size: 0.24 },
        )
        this.floating.add({ x: event.pos.x, y: 3.2, z: event.pos.z }, `-${event.drain} ETH`, 'danger', 1.4)
        break
      case 'spawn':
        this.particles.emit(
          { x: event.pos.x, y: 1, z: event.pos.z },
          {
            count: event.boss ? 40 : 6,
            color: COLORS.danger,
            speed: event.boss ? 3 : 1.4,
            life: 0.5,
            size: 0.16,
            gravity: 1,
          },
        )
        break
      case 'build':
        this.pulses.add(event.pos, 1.1, TOWERS[event.towerId].color, 0.5)
        this.particles.emit(
          { x: event.pos.x, y: 0.5, z: event.pos.z },
          { count: 18, color: TOWERS[event.towerId].color, speed: 2.4, life: 0.6, size: 0.16 },
        )
        break
      case 'upgrade':
        this.pulses.add(event.pos, 1.3, 0xffd166, 0.6)
        this.particles.emit(
          { x: event.pos.x, y: 1, z: event.pos.z },
          { count: 26, color: 0xffd166, speed: 2.6, life: 0.8, size: 0.18 },
        )
        this.floating.add({ x: event.pos.x, y: 2.2, z: event.pos.z }, `Level ${event.level}`, 'info')
        break
      case 'sell':
        this.particles.emit(
          { x: event.pos.x, y: 0.6, z: event.pos.z },
          { count: 14, color: 0xffffff, speed: 2, life: 0.5, size: 0.14 },
        )
        this.floating.add({ x: event.pos.x, y: 1.6, z: event.pos.z }, `+${event.refund}`, 'gold')
        break
      case 'waveCleared':
        this.floating.add(
          { x: this.sim.vaultPos.x, y: 3.6, z: this.sim.vaultPos.z },
          `Wave ${event.index} cleared  +${event.bonus + event.income} SAFE`,
          'bonus',
          2,
        )
        this.pulses.add(this.sim.vaultPos, 4, COLORS.safeGreen, 1.2)
        break
      default:
        break
    }
  }

  // ─── Entity sync ──────────────────────────────────────────────────────────────

  private syncTowers(dt: number): void {
    for (const tower of this.sim.towers.values()) {
      let view = this.towerViews.get(tower.uid)
      if (view && view.level !== tower.level) {
        this.scene.remove(view.model.group)
        view = undefined
      }
      if (!view) {
        const model = buildTowerModel(tower.def, tower.level)
        model.group.position.set(tower.pos.x, 0.2, tower.pos.z)
        this.scene.add(model.group)
        view = { model, level: tower.level, recoil: 0, yaw: 0 }
        this.towerViews.set(tower.uid, view)
      }
      const target = tower.targetUid === null ? undefined : this.sim.enemies.get(tower.targetUid)
      if (target && tower.def.targets !== 'none') {
        const desired = Math.atan2(target.pos.x - tower.pos.x, target.pos.z - tower.pos.z)
        let delta = desired - view.yaw
        while (delta > Math.PI) delta -= Math.PI * 2
        while (delta < -Math.PI) delta += Math.PI * 2
        view.yaw += delta * Math.min(1, dt * 10)
        view.model.head.rotation.y = view.yaw
      }
      view.recoil = Math.max(0, view.recoil - dt * 6)
      const pop = 1 + view.recoil * 0.12
      view.model.head.scale.setScalar(pop)
      view.model.spinners.forEach((s) => {
        s.object.rotation[s.axis] += s.speed * dt
      })
    }
    for (const [uid, view] of this.towerViews) {
      if (!this.sim.towers.has(uid)) {
        this.scene.remove(view.model.group)
        this.towerViews.delete(uid)
      }
    }
  }

  private createEnemyView(enemy: EnemyState): EnemyView {
    const model = buildEnemyModel(enemy.def)
    this.scene.add(model.group)
    return {
      model,
      yaw: 0,
      phase: Math.random() * Math.PI * 2,
      baseEmissive: model.tintable.map((m) => m.emissive.getHex()),
      baseOpacity: model.tintable.map((m) => m.opacity),
    }
  }

  private syncEnemies(dt: number): void {
    const camQuat = this.camera.camera.quaternion
    const now = this.sim.time
    for (const enemy of this.sim.enemies.values()) {
      let view = this.enemyViews.get(enemy.uid)
      if (!view) {
        view = this.createEnemyView(enemy)
        this.enemyViews.set(enemy.uid, view)
      }
      const { model } = view
      const stunned = enemy.stunUntil > now
      const slowed = enemy.slowUntil > now
      const hidden = enemy.def.stealth === true && enemy.revealedUntil < now
      const moving = !stunned
      const speedFactor = slowed ? enemy.slowFactor : 1
      if (moving) view.phase += dt * 9 * enemy.def.speed * speedFactor

      const dir = enemy.def.flying ? this.flyDir : directionAlongPath(this.sim.path, enemy.dist)
      const desiredYaw = Math.atan2(dir.x, dir.z)
      let delta = desiredYaw - view.yaw
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      view.yaw += delta * Math.min(1, dt * 8)

      const bob = enemy.def.flying
        ? model.hoverHeight + Math.sin(this.time * 3 + view.phase) * 0.12
        : Math.abs(Math.sin(view.phase)) * 0.05 * enemy.def.scale
      model.group.position.set(enemy.pos.x, 0.2 + bob, enemy.pos.z)
      model.group.rotation.y = view.yaw
      model.body.rotation.z = moving ? Math.sin(view.phase) * 0.06 : 0
      model.legs.forEach((leg, i) => {
        leg.rotation.x = moving ? Math.sin(view.phase + (i % 2) * Math.PI) * 0.7 : 0
      })
      model.wings.forEach((wing, i) => {
        wing.rotation.z = Math.sin(this.time * 12 + i * Math.PI) * 0.45 * (i % 2 === 0 ? 1 : -1)
        if (!enemy.def.flying) wing.rotation.z = Math.sin(view.phase * 0.5 + i) * 0.25
      })
      model.spinners.forEach((s) => {
        s.rotation.y += dt * 3
      })

      model.tintable.forEach((mat, i) => {
        if (stunned) {
          mat.emissive.copy(STUN_TINT)
          mat.emissiveIntensity = 0.7
        } else if (slowed) {
          mat.emissive.copy(SLOW_TINT)
          mat.emissiveIntensity = 0.55
        } else {
          mat.emissive.setHex(view.baseEmissive[i])
          mat.emissiveIntensity = 1
        }
        if (enemy.def.stealth) {
          mat.opacity = hidden ? 0.16 : view.baseOpacity[i]
        }
      })
      model.hpGroup.visible = !hidden
      model.body.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.castShadow = !hidden
      })

      const ratio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp))
      model.hpFg.scale.x = Math.max(0.001, ratio)
      model.hpFg.position.x = -0.4 * (1 - ratio)
      ;(model.hpFg.material as THREE.MeshBasicMaterial).color.copy(
        ratio > 0.5 ? HP_COLORS.high : ratio > 0.25 ? HP_COLORS.mid : HP_COLORS.low,
      )
      model.hpGroup.quaternion.copy(camQuat)

      if (model.shield) {
        model.shield.visible = enemy.shieldHits > 0
        model.shield.rotation.y += dt * 0.8
        model.shield.rotation.x += dt * 0.3
      }
    }
    for (const [uid, view] of this.enemyViews) {
      if (!this.sim.enemies.has(uid)) {
        this.scene.remove(view.model.group)
        view.model.tintable.forEach((m) => m.dispose())
        this.enemyViews.delete(uid)
      }
    }
  }

  private createProjectileView(p: ProjectileState): THREE.Object3D {
    switch (p.kind) {
      case 'shell': {
        const m = new THREE.Mesh(
          sphere(0.15, 8),
          material({ color: 0x2b2725, emissive: COLORS.warning, emissiveIntensity: 1.4, metalness: 0.6 }),
        )
        return m
      }
      case 'tracer': {
        const m = new THREE.Mesh(box(0.06, 0.06, 0.8), glow(p.color, 2.5))
        return m
      }
      case 'dart': {
        const m = new THREE.Mesh(cone(0.07, 0.34, 5), glow(p.color, 1.8))
        m.rotation.x = Math.PI / 2
        const holder = new THREE.Group()
        holder.add(m)
        return holder
      }
      default:
        return new THREE.Mesh(sphere(0.09, 8), glow(p.color, 2.6))
    }
  }

  private syncProjectiles(): void {
    for (const p of this.sim.projectiles.values()) {
      let view = this.projectileViews.get(p.uid)
      if (!view) {
        view = this.createProjectileView(p)
        this.scene.add(view)
        this.projectileViews.set(p.uid, view)
      }
      view.position.set(p.pos.x, p.pos.y, p.pos.z)
      if (p.kind === 'tracer' || p.kind === 'dart') {
        view.lookAt(p.lastTargetPos.x, p.lastTargetPos.y, p.lastTargetPos.z)
      }
      if (p.kind === 'bolt' || p.kind === 'shell') {
        this.particles.emit(p.pos, { count: 1, color: p.color, speed: 0.2, life: 0.22, size: 0.1, gravity: 0, up: 0 })
      }
    }
    for (const [uid, view] of this.projectileViews) {
      if (!this.sim.projectiles.has(uid)) {
        this.scene.remove(view)
        this.projectileViews.delete(uid)
      }
    }
  }

  worldToScreen(pos: Vec3): { x: number; y: number } {
    const v = new THREE.Vector3(pos.x, pos.y, pos.z).project(this.camera.camera)
    return { x: (v.x * 0.5 + 0.5) * this.width, y: (-v.y * 0.5 + 0.5) * this.height }
  }

  dispose(): void {
    this.resizeObserver?.disconnect()
    this.floating.clear()
    this.particles.dispose()
    this.env.dispose()
    this.composer.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.textLayer.remove()
  }
}

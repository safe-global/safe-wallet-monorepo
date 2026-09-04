import * as THREE from 'three'
import type { Vec3 } from '../sim/types'
import { ring } from './geometry'

const MAX_PARTICLES = 4000

const PARTICLE_VERTEX = `
attribute float size;
attribute float alpha;
attribute vec3 color;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vColor = color;
  vAlpha = alpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (280.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const PARTICLE_FRAGMENT = `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  gl_FragColor = vec4(vColor, a);
}`

export interface EmitOptions {
  count: number
  color: number
  speed?: number
  spread?: number
  life?: number
  size?: number
  gravity?: number
  up?: number
}

/** CPU-simulated additive particle cloud rendered as one draw call. */
export class ParticleSystem {
  readonly points: THREE.Points
  private readonly positions = new Float32Array(MAX_PARTICLES * 3)
  private readonly velocities = new Float32Array(MAX_PARTICLES * 3)
  private readonly colors = new Float32Array(MAX_PARTICLES * 3)
  private readonly sizes = new Float32Array(MAX_PARTICLES)
  private readonly alphas = new Float32Array(MAX_PARTICLES)
  private readonly life = new Float32Array(MAX_PARTICLES)
  private readonly maxLife = new Float32Array(MAX_PARTICLES)
  private readonly gravity = new Float32Array(MAX_PARTICLES)
  private readonly geometry: THREE.BufferGeometry
  private cursor = 0
  private readonly tmpColor = new THREE.Color()

  constructor() {
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))
    const materialShader = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.points = new THREE.Points(this.geometry, materialShader)
    this.points.frustumCulled = false
  }

  emit(pos: Vec3, opts: EmitOptions): void {
    this.tmpColor.setHex(opts.color)
    const speed = opts.speed ?? 2.5
    const spread = opts.spread ?? 0.1
    for (let n = 0; n < opts.count; n++) {
      const i = this.cursor
      this.cursor = (this.cursor + 1) % MAX_PARTICLES
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const v = speed * (0.4 + Math.random() * 0.6)
      this.positions[i * 3] = pos.x + (Math.random() - 0.5) * spread
      this.positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * spread
      this.positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * spread
      this.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * v
      this.velocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * v + (opts.up ?? 0.5)
      this.velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * v
      this.colors[i * 3] = this.tmpColor.r
      this.colors[i * 3 + 1] = this.tmpColor.g
      this.colors[i * 3 + 2] = this.tmpColor.b
      this.sizes[i] = (opts.size ?? 0.18) * (0.6 + Math.random() * 0.8)
      this.life[i] = this.maxLife[i] = (opts.life ?? 0.6) * (0.6 + Math.random() * 0.6)
      this.gravity[i] = opts.gravity ?? 4
      this.alphas[i] = 1
    }
  }

  update(dt: number): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.life[i] <= 0) continue
      this.life[i] -= dt
      if (this.life[i] <= 0) {
        this.alphas[i] = 0
        continue
      }
      this.velocities[i * 3 + 1] -= this.gravity[i] * dt
      this.positions[i * 3] += this.velocities[i * 3] * dt
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt
      if (this.positions[i * 3 + 1] < 0.05) {
        this.positions[i * 3 + 1] = 0.05
        this.velocities[i * 3 + 1] *= -0.3
      }
      this.alphas[i] = Math.min(1, this.life[i] / (this.maxLife[i] * 0.5))
    }
    ;(this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    ;(this.geometry.attributes.alpha as THREE.BufferAttribute).needsUpdate = true
    ;(this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true
    ;(this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.points.material as THREE.Material).dispose()
  }
}

interface Beam {
  line: THREE.Line
  core: THREE.Line
  age: number
  life: number
}

const BEAM_SEGMENTS = 5

/** Jagged lightning arcs used by Safenet chain hits. */
export class BeamSystem {
  readonly group = new THREE.Group()
  private readonly beams: Beam[] = []

  add(points: Vec3[], color: number): void {
    const jittered: number[] = []
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]
      const b = points[i]
      for (let s = 0; s <= BEAM_SEGMENTS; s++) {
        const t = s / BEAM_SEGMENTS
        const jitter = s === 0 || s === BEAM_SEGMENTS ? 0 : 0.18
        jittered.push(
          a.x + (b.x - a.x) * t + (Math.random() - 0.5) * jitter,
          a.y + (b.y - a.y) * t + (Math.random() - 0.5) * jitter,
          a.z + (b.z - a.z) * t + (Math.random() - 0.5) * jitter,
        )
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(jittered, 3))
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }))
    const core = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }))
    core.scale.setScalar(1.001)
    this.group.add(line, core)
    this.beams.push({ line, core, age: 0, life: 0.22 })
  }

  update(dt: number): void {
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const beam = this.beams[i]
      beam.age += dt
      const k = Math.max(0, 1 - beam.age / beam.life)
      ;(beam.line.material as THREE.LineBasicMaterial).opacity = k
      ;(beam.core.material as THREE.LineBasicMaterial).opacity = k * 0.8
      if (beam.age >= beam.life) {
        this.group.remove(beam.line, beam.core)
        beam.line.geometry.dispose()
        ;(beam.line.material as THREE.Material).dispose()
        ;(beam.core.material as THREE.Material).dispose()
        this.beams.splice(i, 1)
      }
    }
  }
}

interface Pulse {
  mesh: THREE.Mesh
  age: number
  life: number
  radius: number
}

/** Expanding ground rings for pulses, splashes and build feedback. */
export class PulseSystem {
  readonly group = new THREE.Group()
  private readonly pulses: Pulse[] = []
  private readonly geo = ring(0.86, 1, 64)

  add(pos: { x: number; z: number }, radius: number, color: number, life = 0.45, y = 0.24): void {
    const mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(pos.x, y, pos.z)
    mesh.scale.setScalar(0.2)
    this.group.add(mesh)
    this.pulses.push({ mesh, age: 0, life, radius })
  }

  update(dt: number): void {
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i]
      pulse.age += dt
      const t = Math.min(1, pulse.age / pulse.life)
      const eased = 1 - (1 - t) * (1 - t)
      pulse.mesh.scale.setScalar(Math.max(0.05, pulse.radius * eased))
      ;(pulse.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t)
      if (t >= 1) {
        this.group.remove(pulse.mesh)
        ;(pulse.mesh.material as THREE.Material).dispose()
        this.pulses.splice(i, 1)
      }
    }
  }
}

interface FloatingItem {
  el: HTMLDivElement
  pos: THREE.Vector3
  age: number
  life: number
}

export interface FloatingTextClasses {
  base: string
  gold: string
  danger: string
  info: string
  bonus: string
}

/** DOM overlay for floating combat text, projected from world space every frame. */
export class FloatingTextLayer {
  private readonly items: FloatingItem[] = []
  private readonly tmp = new THREE.Vector3()

  constructor(
    private readonly container: HTMLElement,
    private readonly classes: FloatingTextClasses,
  ) {}

  add(pos: Vec3, text: string, tone: keyof Omit<FloatingTextClasses, 'base'> = 'gold', life = 1.1): void {
    if (this.items.length > 60) {
      const oldest = this.items.shift()
      oldest?.el.remove()
    }
    const el = document.createElement('div')
    el.className = `${this.classes.base} ${this.classes[tone]}`
    el.textContent = text
    this.container.appendChild(el)
    this.items.push({ el, pos: new THREE.Vector3(pos.x, pos.y, pos.z), age: 0, life })
  }

  update(dt: number, camera: THREE.Camera, width: number, height: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]
      item.age += dt
      if (item.age >= item.life) {
        item.el.remove()
        this.items.splice(i, 1)
        continue
      }
      const t = item.age / item.life
      this.tmp.copy(item.pos)
      this.tmp.y += t * 1.2
      this.tmp.project(camera)
      const x = (this.tmp.x * 0.5 + 0.5) * width
      const y = (-this.tmp.y * 0.5 + 0.5) * height
      item.el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      item.el.style.opacity = String(t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3)
    }
  }

  clear(): void {
    this.items.forEach((item) => item.el.remove())
    this.items.length = 0
  }
}
